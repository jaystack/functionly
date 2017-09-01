import { Resource } from './resource'
import { callExtension } from '../classes'
import { constants, getMetadata, getOverridableMetadata } from '../annotations'
const { PARAMETER_PARAMKEY } = constants

import { InProcProvider } from '../providers/inProc'
const provider = new InProcProvider()

export class Service extends Resource {
    public handle(...params) {

    }

    public async invoke(params?, invokeConfig?) {
        const availableParams = {}
        const parameterMapping = (getOverridableMetadata(PARAMETER_PARAMKEY, this.constructor, 'handle') || [])
        parameterMapping.forEach((target) => {
            if (params && target && target.type === 'param') {
                availableParams[target.from] = params[target.from]
            }
        })

        await callExtension(this, `onInvoke`, {
            invokeParams: params,
            params: availableParams,
            invokeConfig,
            parameterMapping
        })

        const invoker = provider.getInvoker(this, undefined)

        return await invoker(availableParams)
    }

    public static async onInject({ parameter }): Promise<any> {
        const service = new this()
        return (...params) => service.invoke(...params)
    }
}