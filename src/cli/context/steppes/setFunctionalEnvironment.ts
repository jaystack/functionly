import { environment } from '../../../annotations'
import { ContextStep } from '../core/contextStep'
export class SetFunctionalEnvironmentStep extends ContextStep {
    public async execute(context) {
        for (let serviceDefinition of context.publishedFunctions) {
            const setEnvAttrib = environment('FUNCTIONAL_ENVIRONMENT', context.FUNCTIONAL_ENVIRONMENT)
            setEnvAttrib(serviceDefinition.service)
        }
    }
}

export const setFunctionalEnvironment = new SetFunctionalEnvironmentStep('setFunctionalEnvironment')
