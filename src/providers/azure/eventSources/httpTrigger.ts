import { EventSource } from '../../core/eventSource'
import { get } from '../../../helpers/property'

export class HttpTrigger extends EventSource {
    public async parameterResolver(parameter, context) {
        const body = context.event.req.body
        const query = context.event.req.query
        const params = context.event.req.params
        const headers = context.event.req.headers

        switch (parameter.type) {
            case 'param':
                const source = parameter.source;
                if (typeof source !== 'undefined') {
                    const holder = !source ? context : get(context, source)
                    if (holder) {
                        return get(holder, parameter.from)
                    }
                } else {
                    let value
                    if (typeof (value = get(body, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(query, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(params, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(headers, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(context, parameter.from)) !== 'undefined') return value
                    return value;
                }
                return undefined
            default:
                return await super.parameterResolver(parameter, context)
        }
    }

    public async resultTransform(error, result, eventContext) {
        if (error) {
            return {
                status: 500,
                body: `${error.message} - ${error.stack}`
            }
        }

        if (result && typeof result.status === 'number' && result.hasOwnProperty('data')) {
            return {
                status: result.status,
                headers: result.headers,
                body: result.data
            }
        }

        if (result && typeof result.status === 'number' && result.hasOwnProperty && result.hasOwnProperty('body')) {
            return result
        }

        return {
            status: 200,
            body: result
        }
    }
}