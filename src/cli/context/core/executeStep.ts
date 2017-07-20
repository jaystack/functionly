export const executeSteppes = new Map<string, ExecuteStep | { name: string, method: (c) => any }>()

export class ExecuteStep {
    public name: string
    public constructor(name) {
        this.name = name

        if (executeSteppes.has(this.name)) {
            throw new Error(`step name '${this.name}' already defined`)
        }
        executeSteppes.set(this.name, this)
    }

    public method(context) {

    }

    public static register(name, method) {
        if (executeSteppes.get(name)) {
            throw new Error(`step name '${name}' already defined`)
        }

        const step = {
            name,
            method
        }

        executeSteppes.set(name, step)
        return step
    }

    public static get(name: string) {
        if (executeSteppes.has(name)) {
            return executeSteppes.get(name)
        }
    }
}