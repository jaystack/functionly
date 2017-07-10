import { EventSource } from '../../core/eventSource'
import { get } from '../../../helpers/property'

export class LambdaCall extends EventSource {
    public async parameterResolver(parameter, event) {
        switch (parameter.type) {
            case 'param':
                return get(event.event, parameter.from)
            default:
                return await super.parameterResolver(parameter, event)
        }
    }
}