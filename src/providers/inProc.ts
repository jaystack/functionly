import * as request from 'request'
import { Provider } from './core/provider'
import { constants, getMetadata, getFunctionName, rest } from '../annotations'
const { CLASS_LOGKEY } = constants
import { get } from '../helpers/property'
import { parse } from 'url'

export class InProcProvider extends Provider {
    public getInvoker(serviceInstance, params) {
        const callContext = this.createCallContext(serviceInstance, 'handle')

        const invoker = async (invokeParams) => {
            const eventContext = { params: invokeParams }

            let result
            let error
            try {
                result = await callContext({ event: eventContext, serviceInstance })
            } catch (err) {
                error = err
            }
            const response = await this.resultTransform(error, result, eventContext)

            return response
        }
        return invoker
    }

    protected resultTransform(error, result, eventContext) {
        if (error) throw error

        if (result && typeof result.status === 'number' && result.hasOwnProperty('data')) {
            return result.data
        }

        return result
    }

}

InProcProvider.addParameterDecoratorImplementation("param", async (parameter, context, provider) => {
    const req = context.event.params
    const source = parameter.source;
    if (typeof source !== 'undefined') {
        const holder = !source ? context : get(context, source)
        if (holder) {
            return get(holder, parameter.from)
        }
    } else {
        let value = undefined
        if (typeof (value = get(req, parameter.from)) !== 'undefined') return value
        if (typeof (value = get(context.context, parameter.from)) !== 'undefined') return value
        return value
    }
    return undefined
})

/*InProcProvider.addParameterDecoratorImplementation("request", async (parameter, context, provider) => {
    return {
        url: context.event.req._parsedUrl || parse(context.event.req.originalUrl),
        method: context.event.req.method,
        body: context.event.req.body,
        query: context.event.req.query,
        params: context.event.req.params,
        headers: context.event.req.headers
    }
})*/

export const provider = new InProcProvider()
