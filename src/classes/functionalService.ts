import { Service } from './service'
import { getInvoker, invoke } from '../providers'
import { defineMetadata, getMetadata, constants, getFunctionName } from '../annotations'
const { CLASS_ENVIRONMENTKEY } = constants

export const FUNCTIONAL_SERVICE_PREFIX = 'FUNCTIONAL_SERVICE_'

export class FunctionalService extends Service {
    public handle(...params) {

    }

    public async invoke(params?, invokeConfig?) {
        return await invoke(this, params, invokeConfig)
    }

    public static createInvoker(...params) {
        let invoker = getInvoker(this, params)
        return invoker
    }

    public static onDefineInjectTo(target) {
        const metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}
        const funcName = getFunctionName(this) || 'undefined'
        metadata[`${FUNCTIONAL_SERVICE_PREFIX}${funcName.toUpperCase()}`] = funcName
        defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
    }
}