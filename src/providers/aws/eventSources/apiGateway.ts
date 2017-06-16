import { EventSource } from './eventSource'

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
                if (body && body[parameter.from]) return body[parameter.from]
                if (query && query[parameter.from]) return query[parameter.from]
                if (params && params[parameter.from]) return params[parameter.from]
                if (headers && headers[parameter.from]) return headers[parameter.from]
                break
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