import * as request from 'request'
import { constants, getOwnMetadata, getMetadata, resolveHandler } from '../annotations'

export const getInvoker = (serviceType) => {
    let serviceInstance = new serviceType()
    let invoker = async (req, res, next) => {
        try {
            let parameterMapping = getOwnMetadata(constants.Parameter_ParamKey, serviceType.prototype, 'handle') || [];

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
        case 'service':
            let serviceType = resolveHandler(target.serviceTypeName)
            return new serviceType()
        default:
            if (req.body && req.body[target.from]) return req.body[target.from]
            if (req.query && req.query[target.from]) return req.query[target.from]
            if (req.params && req.params[target.from]) return req.params[target.from]
    }
}

export const invoke = async (serviceType, ...params) => {
    return new Promise((resolve, reject) => {
        let lambdaParams = {}

        let parameterMapping = getOwnMetadata(constants.Parameter_ParamKey, serviceType.prototype, 'handle') || [];
        parameterMapping.forEach((target) => {
            if (target && typeof target.parameterIndex === 'number' && target.type === 'param') {
                lambdaParams[target.from] = params[target.parameterIndex]
            }
        })

        let httpAttr = getMetadata(constants.Class_HttpKey, serviceType)[0]
        if (!httpAttr) {
            return reject(new Error('missing http configuration'))
        }

        let invokeParams: any = {
            method: httpAttr.method || 'GET',
            url: `http://localhost:${process.env.FUNCTIONAL_LOCAL_PORT}${httpAttr.path}`,
            FunctionName: getMetadata(constants.Class_NameKey, serviceType),
            PayLoad: JSON.stringify(lambdaParams)
        };

        if (!httpAttr.method || httpAttr.method.toLowerCase() === 'get') {
            invokeParams.qs = lambdaParams
        } else {
            invokeParams.body = lambdaParams
            invokeParams.json = true
        }

        try {
            request(invokeParams, (error, response, body) => {

                if (error) return reject(error)
                return resolve(JSON.parse(body))

            })
        } catch (e) {
            return reject(e);
        }
    })
}