import { EventSource } from './eventSource'
import { get } from '../../../helpers/property'

export class DynamoTable extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && Array.isArray(event.Records) && event.Records.length && event.Records[0].eventSource === "aws:dynamodb" ? true : false
    }

    public async parameterResolver(parameter, event) {
        const holder = this.getHolder(event.event.Records[0], event.event, parameter)

        switch (parameter.type) {
            case 'param':
                return get(holder, parameter.from)
            default:
                return await super.parameterResolver(parameter, event)
        }
    }
}