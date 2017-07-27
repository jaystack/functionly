import { EventSource } from '../../core/eventSource'
import { get } from '../../../helpers/property'

export class LambdaCall extends EventSource {
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
                    if (typeof (value = get(context.event.event, parameter.from)) !== 'undefined') return value
                    if (typeof (value = get(context, parameter.from)) !== 'undefined') return value
                    return value;
                }
                return undefined
            default:
                return await super.parameterResolver(parameter, context)
        }
    }
}