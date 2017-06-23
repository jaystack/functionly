import { EventSource } from './eventSource'
import { get } from '../../../helpers/property'

export class SNS extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && Array.isArray(event.Records) && event.Records.length && event.Records[0].EventSource === "aws:sns" ? true : false
    }

    public async parameterResolver(parameter, event) {
        const data = event.event.Records[0]

        switch (parameter.type) {
            case 'param':
                return get(data, parameter.from)
            default:
                return await super.parameterResolver(parameter, event)
        }
    }
}