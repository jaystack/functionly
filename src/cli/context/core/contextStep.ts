export const contextSteppes: { [x: string]: ContextStep | { name: string, execute: (c) => any } } = {}

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

    public static register(name, execute) {
        if (contextSteppes[name]) {
            throw new Error(`step name '${name}' already defined`)
        }

        const step = {
            name,
            execute
        }

        contextSteppes[name] = step

        return step
    }
}