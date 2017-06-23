import { EventSource } from './eventSource'
import { get } from '../../../helpers/property'

export class ApiGateway extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && event.requestContext && event.requestContext.apiId ? true : false
    }

    public async parameterResolver(parameter, event) {
        const body = event.event.body
        const query = event.event.queryStringParameters
        const params = event.event.pathParameters
        const headers = event.event.headers
        
        switch (parameter.type) {
            case 'param':
                let value
                if (typeof (value = get(body, parameter.from)) !== 'undefined') return value
                if (typeof (value = get(query, parameter.from)) !== 'undefined') return value
                if (typeof (value = get(params, parameter.from)) !== 'undefined') return value
                if (typeof (value = get(headers, parameter.from)) !== 'undefined') return value
                return value;
            default:
                return await super.parameterResolver(parameter, event)
        }
    }

    public async resultTransform(err, result, event) {
        if (err) {
            return {
                statusCode: 500,
                body: JSON.stringify(err)
            }
        }

        if (result && typeof result.statusCode === 'number' && typeof result.body === 'string') {
            return result
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        }
    }
}