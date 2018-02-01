import { Resource } from './resource'
import { getInvoker, invoke } from '../providers'
import { defineMetadata, getMetadata, constants, getFunctionName } from '../annotations'
const { CLASS_ENVIRONMENTKEY } = constants
import { container } from '../helpers/ioc'

export const FUNCTIONAL_SERVICE_PREFIX = 'FUNCTIONAL_SERVICE_'

export class FunctionalService extends Resource {
    public static handle(...params) {

    }

    public static async invoke(params?, invokeConfig?) {
        return await invoke(this, params, invokeConfig)
    }

    public static createInvoker(...params) {
        let invoker = getInvoker(this, params)
        return invoker
    }

    public static async onInject({ parameter, context }): Promise<any> {
        const injectableType = container.resolveType(this)
        return (params?, invokeConfig?) => injectableType.invoke(params, { ...invokeConfig, context: context.context })
    }

    public static onDefineInjectTo(target) {
        const metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}
        const funcName = getFunctionName(this) || 'undefined'
        metadata[`${FUNCTIONAL_SERVICE_PREFIX}${funcName.toUpperCase()}`] = funcName
        defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
    }
}