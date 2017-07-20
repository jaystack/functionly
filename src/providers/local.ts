import * as request from 'request'
import { constants, getOwnMetadata, getMetadata, getFunctionName } from '../annotations'

export const getInvoker = (serviceType, params) => {
    const serviceInstance = new serviceType(...params)
    const parameterMapping = (getOwnMetadata(constants.PARAMETER_PARAMKEY, serviceType, 'handle') || [])
        .filter(t => t && typeof t.parameterIndex === 'number');
        
    const invoker = async (req, res, next) => {
        try {
            const params = []
            parameterMapping.forEach((target) => {
                params[target.parameterIndex] = parameterResolver(req, target)
            })

            const r = await serviceInstance.handle.apply(serviceInstance, params)
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
            let serviceType = target.serviceType
            return new serviceType(...target.params.map((p) => typeof p === 'function' ? p() : p))
        default:
            if (req.body && req.body[target.from]) return req.body[target.from]
            if (req.query && req.query[target.from]) return req.query[target.from]
            if (req.params && req.params[target.from]) return req.params[target.from]
    }
}

export const invoke = async (serviceInstance, params?, invokeConfig?) => {
    return new Promise((resolve, reject) => {
        let lambdaParams = {}

        let parameterMapping = getOwnMetadata(constants.PARAMETER_PARAMKEY, serviceInstance.constructor, 'handle') || [];
        parameterMapping.forEach((target) => {
            if (params && target && target.type === 'param') {
                lambdaParams[target.from] = params[target.from]
            }
        })

        let httpAttr = getMetadata(constants.CLASS_APIGATEWAYKEY, serviceInstance)[0]
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

            const isLoggingEnabled = getMetadata(constants.CLASS_LOGKEY, serviceInstance)
            if (isLoggingEnabled) {
                console.log(`${new Date().toISOString()} request to ${getFunctionName(serviceInstance)}`, JSON.stringify(invokeParams, null, 2))
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