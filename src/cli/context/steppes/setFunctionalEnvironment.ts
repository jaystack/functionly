import { environment } from '../../../annotations'
import { ExecuteStep } from '../core/executeStep'
export class SetFunctionalEnvironmentStep extends ExecuteStep {
    public async method(context) {
        for (let serviceDefinition of context.publishedFunctions) {
            const setEnvAttrib = environment('FUNCTIONAL_ENVIRONMENT', context.FUNCTIONAL_ENVIRONMENT)
            setEnvAttrib(serviceDefinition.service)
        }
    }
}

export const setFunctionalEnvironment = new SetFunctionalEnvironmentStep('SetFunctionalEnvironment')
