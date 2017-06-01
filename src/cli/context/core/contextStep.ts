export const contextSteppes: { [x: string]: ContextStep } = {}

export class ContextStep {
    public name: string
    public constructor(name) {
        this.name = name

        if (contextSteppes[this.name]) {
            throw new Error(`step name '${this.name}' already defined`)
        }
        contextSteppes[this.name] = this
    }

    public execute(context) {

    }
}