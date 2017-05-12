import { getInvoker, invoke } from '../providers'
import { resolveHandler } from '../annotations'

export class FunctionalService {

    public handle(...params) {

    }

    public async invoke(...params) {
        return await invoke(resolveHandler(this.constructor.name), ...params)
    }

    public static createInvoker() {
        let invoker = getInvoker(this)
        return invoker
    }
}