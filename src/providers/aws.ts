import { Lambda } from 'aws-sdk'
import { constants, getOwnMetadata, getMetadata, getFunctionName } from '../annotations'

let lambda = new Lambda();

export const getInvoker = (serviceType, params) => {
    const serviceInstance = new serviceType(...params)
    const parameterMapping = (getOwnMetadata(constants.Parameter_ParamKey, serviceType, 'handle') || [])
        .filter(t => t && typeof t.parameterIndex === 'number');

    const invoker = async (event, context, cb) => {
        try {
            const params = []
            parameterMapping.forEach((target) => {
                params[target.parameterIndex] = parameterResolver(event, context, target)
            })

            const r = await serviceInstance.handle.apply(serviceInstance, params)
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
            let serviceType = target.serviceType
            return new serviceType(...target.params.map((p) => typeof p === 'function' ? p() : p))
        default:
            return event[target.from]
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

        let invokeParams = {
            FunctionName: getFunctionName(serviceInstance),
            Payload: JSON.stringify(lambdaParams)
        };

        lambda.invoke(invokeParams, function (err, data) {
            if (err) reject(err)
            else resolve(JSON.parse(data.Payload.toString()));
        });
    })
}