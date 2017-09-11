import { EventSource } from '../../core/eventSource'
import { get } from '../../../helpers/property'
import { CLASS_APIGATEWAYKEY } from '../../../annotations/constants'
import { getMetadata, defineMetadata } from '../../../annotations/metadata'

export class ApiGateway extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && event.requestContext && event.requestContext.apiId ? true : false
    }

    public async parameterResolver(parameter, context) {
        const body = context.event.event.body
        const query = context.event.event.queryStringParameters
        const params = context.event.event.pathParameters
        const headers = context.event.event.headers

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
                    if (typeof body === 'string') {
                        try {
                            const parsedBody = JSON.parse(body)
                            if (typeof (value = get(parsedBody, parameter.from)) !== 'undefined') return value
                            // fallback to other options
                        } catch(e) {
                            // fallback to other options
                        }
                    } else if (typeof (value = get(body, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(query, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(params, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(headers, parameter.from)) !== 'undefined') return value
                    return value;
                }
                return undefined
            default:
                return await super.parameterResolver(parameter, context)
        }
    }

    public async resultTransform(err, result, event, serviceInstance) {
        let headers = {}
        const metadata = getMetadata(CLASS_APIGATEWAYKEY, serviceInstance) || []
        if (serviceInstance && metadata.find(m => m.cors === true)) {
            headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
                'Access-Control-Allow-Credentials': 'true'
            }
        }

        if (err) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify(err)
            }
        }

        if (result && typeof result.status === 'number' && result.hasOwnProperty('data')) {
            return {
                statusCode: result.status,
                headers: { ...headers, ...result.headers },
                data: JSON.stringify(result.data)
            }
        }

        if (result && typeof result.statusCode === 'number' && typeof result.body === 'string') {
            return result
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        }
    }
}