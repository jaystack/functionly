import { Resource } from './resource'
import { callExtension } from '../classes/core/callExtension'
import { constants, getMetadata, getOverridableMetadata } from '../annotations'
const { PARAMETER_PARAMKEY } = constants

import { InProcProvider } from '../providers/inProc'
import { container } from '../helpers/ioc'

const provider = container.resolve(InProcProvider)

export class Service extends Resource {
    public static handle(...params) {

    }

    public static async invoke(params?, invokeConfig?) {
        const availableParams = {}
        const parameterMapping = (getOverridableMetadata(PARAMETER_PARAMKEY, this, 'handle') || [])
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
        const injectableType = container.resolveType(this)
        return (...params) => injectableType.invoke(...params)
    }

    public static onDefineInjectTo(target, targetKey, parameterIndex: number) {
        super.onDefineInjectTo(target, targetKey, parameterIndex)

        const targetTkey = 'handle'
        const injectedDefinitions: any[] = (getMetadata(PARAMETER_PARAMKEY, this, targetTkey) || [])
            .filter(p => p.type === 'inject')

        for (const { serviceType, targetKey, parameterIndex } of injectedDefinitions) {
            if (typeof serviceType.onDefineInjectTo === 'function') {
                serviceType.onDefineInjectTo(target, targetTkey, parameterIndex)
            }
        }
    }
}