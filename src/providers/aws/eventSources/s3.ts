import { EventSource } from '../../core/eventSource'
import { get } from '../../../helpers/property'

export class S3 extends EventSource {
    public available(eventContext: any): boolean {
        const { event } = eventContext
        return event && Array.isArray(event.Records) && event.Records.length && event.Records[0].eventSource === "aws:s3" ? true : false
    }

    public async parameterResolver(parameter, context) {
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
                    if (typeof (value = get(context.event.event.Records[0], parameter.from)) !== 'undefined') return value
                    return value;
                }
                return undefined
            default:
                return await super.parameterResolver(parameter, context)
        }
    }
}