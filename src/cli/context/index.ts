export { ExecuteStep } from './core/executeStep'
export { executor } from './core/executor'

import { serviceDiscovery } from './steppes/serviceDiscovery'
import { tableDiscovery } from './steppes/tableDiscovery'
import './steppes/setFunctionalEnvironment'
import './steppes/metadata/serviceMetadata'
import { resolvePath } from '../utilities/cli'
import { callContextHookStep } from '../extensions/hooks'
import { executor } from './core/executor'
import { codeCompile } from './steppes/codeCompile'

export const getDefaultSteppes = (): any[] => {
    return [
        callContextHookStep,
        codeCompile
    ]
}

export const getInitSteppes = (): any[] => {
    return [
        serviceDiscovery,
        tableDiscovery
    ]
}

export const createContext = async (path, defaultValues) => {
    const context = {
        ...defaultValues,
        serviceRoot: resolvePath(path),
        date: new Date(),
        runStep: async function (step) { return await executor(this, step) },


        init: async () => {
            const initSteppes = getInitSteppes()
            for (const step of initSteppes) {
                await executor(context, step)
            }
        }
    }

    const defaultSteppes = getDefaultSteppes()
    for (const step of defaultSteppes) {
        await executor(context, step)
    }

    return context
}

