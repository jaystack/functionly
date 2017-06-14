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
}