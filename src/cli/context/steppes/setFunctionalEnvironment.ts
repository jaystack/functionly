import { environment } from '../../../annotations'
import { ExecuteStep } from '../core/executeStep'
export class SetFunctionalEnvironmentStep extends ExecuteStep {
    public async method(context) {
        for (let serviceDefinition of context.publishedFunctions) {
            const setFuncEnvEnvAttrib = environment('FUNCTIONAL_ENVIRONMENT', context.FUNCTIONAL_ENVIRONMENT)
            const setStageEnvAttrib = environment('FUNCTIONAL_STAGE', context.stage)
            const setProjectNameEnvAttrib = environment('FUNCTIONAL_PROJECTNAME', context.projectName)
            setFuncEnvEnvAttrib(serviceDefinition.service)
            setStageEnvAttrib(serviceDefinition.service)
            setProjectNameEnvAttrib(serviceDefinition.service)
        }
    }
}

export const setFunctionalEnvironment = new SetFunctionalEnvironmentStep('SetFunctionalEnvironment')
