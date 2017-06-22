import { EventSource } from './eventSource'

export class S3 extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && Array.isArray(event.Records) && event.Records.length && event.Records[0].EventSource === "aws:s3" ? true : false
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