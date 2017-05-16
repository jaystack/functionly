import { Lambda } from 'aws-sdk'
import { constants, getOwnMetadata, getMetadata, resolveHandler } from '../annotations'

let lambda = new Lambda();

export const getInvoker = (serviceType, params) => {
    let serviceInstance = serviceType.factory(...params)
    let invoker = async (event, context, cb) => {
        try {
            let parameterMapping = getOwnMetadata(constants.Parameter_ParamKey, serviceType.prototype, 'handle') || [];

            let params = []
            parameterMapping.forEach((target) => {
                if (target && typeof target.parameterIndex === 'number') {
                    params[target.parameterIndex] = parameterResolver(event, context, target)
                }
            })

            let r = await serviceInstance.handle.apply(serviceInstance, params)
            cb(null, r)
            return r
        } catch (e) {
            cb(e)
        }
    }
    return invoker
}

const parameterResolver = (event, context, target) => {
    switch (target.type) {
        case 'inject':
            let serviceType = resolveHandler(target.serviceTypeName)
            return serviceType.factory(...target.params.map((p) => typeof p === 'function' ? p() : p))
        default:
            return event[target.from]
    }
}

export const invoke = async (serviceType, params) => {
    return new Promise((resolve, reject) => {
        let lambdaParams = {}

        let parameterMapping = getOwnMetadata(constants.Parameter_ParamKey, serviceType.prototype, 'handle') || [];
        parameterMapping.forEach((target) => {
            if (target && typeof target.parameterIndex === 'number' && target.type === 'param') {
                lambdaParams[target.from] = params[target.parameterIndex]
            }
        })

        let invokeParams = {
            FunctionName: serviceType.name,
            Payload: JSON.stringify(lambdaParams)
        };

        lambda.invoke(invokeParams, function (err, data) {
            if (err) reject(err)
            else resolve(JSON.parse(data.Payload.toString()));
        });
    })
}