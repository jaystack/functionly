import { Service } from './service'

import { getInvoker, invoke } from '../providers'
import { resolveHandler } from '../annotations'

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
}