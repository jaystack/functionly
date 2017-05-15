import { get } from 'lodash'

import * as aws from './aws'
import * as local from './local'
import * as deploy from './deploy'

let environments = { aws, local, deploy }

export const getInvoker = (serviceType, params) => {

    if (!process.env.FUNCTIONAL_ENVIRONMENT || !environments[process.env.FUNCTIONAL_ENVIRONMENT]) {
        throw new Error(`missing environment: process.env.FUNCTIONAL_ENVIRONMENT`)
    }

    let currentEnvironment = environments[process.env.FUNCTIONAL_ENVIRONMENT]

    let invoker = currentEnvironment.getInvoker(serviceType, params)

    Object.defineProperty(invoker, 'serviceType', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: serviceType,
    })

    return invoker
}

export const invoke = async (serviceType, params) => {
    if (!process.env.FUNCTIONAL_ENVIRONMENT || !environments[process.env.FUNCTIONAL_ENVIRONMENT]) {
        throw new Error(`missing environment: process.env.FUNCTIONAL_ENVIRONMENT`)
    }

    let currentEnvironment = environments[process.env.FUNCTIONAL_ENVIRONMENT]

    return await currentEnvironment.invoke(serviceType, params)
}