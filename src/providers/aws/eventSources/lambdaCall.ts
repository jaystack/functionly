import { EventSource } from './eventSource'

export class LambdaCall extends EventSource {
    public async parameterResolver(parameter, event) {
        switch (parameter.type) {
            case 'param':
                return event.event[parameter.from]
            default:
                return await super.parameterResolver(parameter, event)
        }
    }
}