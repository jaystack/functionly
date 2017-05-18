import * as request from 'request'
import { constants, getOwnMetadata, getMetadata, resolveHandler } from '../annotations'

export const getInvoker = (serviceType, params) => {
    let serviceInstance = serviceType.factory(...params)
    let invoker = async (req, res, next) => {
        try {
            let parameterMapping = getOwnMetadata(constants.Parameter_ParamKey, serviceType, 'handle') || [];

            let params = []
            parameterMapping.forEach((target) => {
                if (target && typeof target.parameterIndex === 'number') {
                    params[target.parameterIndex] = parameterResolver(req, target)
                }
            })

            let r = await serviceInstance.handle.apply(serviceInstance, params)
            res.send(r)
            return r
        } catch (e) {
            next(e)
        }
    }
    return invoker
}

const parameterResolver = (req, target) => {
    switch (target.type) {
        case 'inject':
            let serviceType = resolveHandler(target.serviceTypeName)
            return serviceType.factory(...target.params.map((p) => typeof p === 'function' ? p() : p))
        default:
            if (req.body && req.body[target.from]) return req.body[target.from]
            if (req.query && req.query[target.from]) return req.query[target.from]
            if (req.params && req.params[target.from]) return req.params[target.from]
    }
}

export const invoke = async (serviceInstance, params?, invokeConfig?) => {
    return new Promise((resolve, reject) => {
        let lambdaParams = {}

        let parameterMapping = getOwnMetadata(constants.Parameter_ParamKey, serviceInstance.constructor, 'handle') || [];
        parameterMapping.forEach((target) => {
            if (params && target && target.type === 'param') {
                lambdaParams[target.from] = params[target.from]
            }
        })

        let httpAttr = getMetadata(constants.Class_ApiGatewayKey, serviceInstance)[0]
        if (!httpAttr) {
            return reject(new Error('missing http configuration'))
        }

        let invokeParams: any = {
            method: httpAttr.method || 'GET',
            url: `http://localhost:${process.env.FUNCTIONAL_LOCAL_PORT}${httpAttr.path}`,
        };

        if (!httpAttr.method || httpAttr.method.toLowerCase() === 'get') {
            invokeParams.qs = lambdaParams
        } else {
            invokeParams.body = lambdaParams
            invokeParams.json = true
        }

        try {

            const isLoggingEnabled = getMetadata(constants.Class_LogKey, serviceInstance)
            if (isLoggingEnabled) {
                console.log(`${new Date().toISOString()} request to ${serviceInstance.contructor.name}`, JSON.stringify(invokeParams, null, 2))
            }

            request(invokeParams, (error, response, body) => {

                if (error) return reject(error)

                let result = body
                try {
                    result = JSON.parse(result)
                }
                catch (e) { }

                return resolve(result)

            })
        } catch (e) {
            return reject(e);
        }
    })
}