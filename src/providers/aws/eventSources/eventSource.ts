import { get } from '../../../helpers/property'

export abstract class EventSource {
    public available(event: any) {
        return true
    }

    public async parameterResolver(parameter, event: any) {
        return undefined
    }

    public async resultTransform(err, result, event: any) {
        if (err) throw err
        return result
    }

    protected getHolder(suggestedHolder, data, parameter) {
        const source = parameter.source;
        if (typeof source !== 'undefined') {
            const holder = !source ? data : get(data, source)
            return holder
        } else {
            return suggestedHolder
        }
    }
}