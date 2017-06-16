import { EventSource } from './eventSource'

export class SNS extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && Array.isArray(event.Records) ? true : false
    }

    public async parameterResolver(parameter, event) {
        const data = event.event.Records[0]

        switch (parameter.type) {
            case 'param':
                if (data && data[parameter.from]) return data[parameter.from]
                break
            default:
                return await super.parameterResolver(parameter, event)
        }
    }
}