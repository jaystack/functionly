import { EventSource } from '../../core/eventSource'
import { get } from '../../../helpers/property'

export class HttpTrigger extends EventSource {
    public async parameterResolver(parameter, event) {
        const body = event.req.body
        const query = event.req.query
        const params = event.req.params
        const headers = event.req.headers

        switch (parameter.type) {
            case 'param':
                const source = parameter.source;
                if (typeof source !== 'undefined') {
                    const holder = !source ? event.req : get(event.req, source)
                    if (holder) {
                        return get(holder, parameter.from)
                    }
                } else {
                    let value
                    if (typeof (value = get(body, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(query, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(params, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(headers, parameter.from)) !== 'undefined') return value
                    return value;
                }
                return undefined
            default:
                return await super.parameterResolver(parameter, event)
        }
    }

    public async resultTransform(error, result, eventContext) {
        if (error) {
            return {
                status: 500,
                body: `${error.message} - ${error.stack}`
            }
        }

        if (result && typeof result.status === 'number' && typeof result.body === 'string') {
            return result
        }

        return {
            status: 200,
            body: result
        }
    }
}