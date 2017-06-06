import { get } from 'lodash'
import { constants, getOwnMetadata } from '../annotations'
import { callExtension } from '../classes'

export { Provider } from './core/provider'
export { AWSProvider } from './aws'
export { LocalProvider } from './local'
export { DeployProvider } from './deploy'

import { Provider } from './core/provider'
import { provider as aws } from './aws'
import { provider as local } from './local'
import { provider as deploy } from './deploy'

let environments = {}
let invokeEnvironments = {}

export const addProvider = (name, provider: Provider) => {
    environments[name] = provider
    invokeEnvironments[name] = provider
}

export const removeProvider = (name) => {
    delete environments[name]
    delete invokeEnvironments[name]
}

addProvider('aws', aws)
addProvider('local', local)
addProvider('deploy', deploy)

export const getInvoker = (serviceType, params) => {
    const environment = process.env.FUNCTIONAL_ENVIRONMENT;

    if (!environment || !environments[environment]) {
        throw new Error(`missing environment: '${environment}'`)
    }

    const currentEnvironment = environments[environment]

    const serviceInstance = new serviceType(...params)
    const invoker = currentEnvironment.getInvoker(serviceType, serviceInstance, params)

    const invokeHandler = async (...params) => {
        const onHandleResult = await callExtension(serviceInstance, `onHandle_${environment}`, ...params)
        if (typeof onHandleResult !== 'undefined') {
            return onHandleResult
        }
        return await invoker(...params)
    }

    Object.defineProperty(invokeHandler, 'serviceType', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: serviceType,
    })

    return invokeHandler
}

export const invoke = async (serviceInstance, params?, invokeConfig?) => {
    await callExtension(serviceInstance, 'onInvoke', {
        params,
        invokeConfig,
    })

    const environmentMode = (invokeConfig && invokeConfig.mode) || process.env.FUNCTIONAL_ENVIRONMENT

    if (!environmentMode || !invokeEnvironments[environmentMode]) {
        throw new Error(`missing environment: '${environmentMode}' for invoke`)
    }

    let currentEnvironment = invokeEnvironments[environmentMode]

    const availableParams = {}
    const parameterMapping = (getOwnMetadata(constants.PARAMETER_PARAMKEY, serviceInstance.constructor, 'handle') || [])
    parameterMapping.forEach((target) => {
        if (params && target && target.type === 'param') {
            availableParams[target.from] = params[target.from]
        }
    })

    await callExtension(serviceInstance, `onInvoke_${environmentMode}`, {
        invokeParams: params,
        params: availableParams,
        invokeConfig,
        parameterMapping,
        currentEnvironment,
        environmentMode
    })

    return await currentEnvironment.invoke(serviceInstance, availableParams, invokeConfig)
}