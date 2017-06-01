import * as aws from './aws'
import * as local from './local'
import * as cf from './cloudFormation'
import { contextSteppes, ContextStep } from '../context'

let environments = { aws, local, cf }

export class CreateEnvironmentStep extends ContextStep {
    public async execute(context) {
        let currentEnvironment = environments[context.deployTarget]

        if (!currentEnvironment) {
            throw new Error(`unhandled deploy target: '${context.deployTarget}'`)
        }

        if (currentEnvironment.FUNCTIONAL_ENVIRONMENT) {
            context.FUNCTIONAL_ENVIRONMENT = currentEnvironment.FUNCTIONAL_ENVIRONMENT
            await context.runStep(contextSteppes.setFunctionalEnvironment)
        }

        await currentEnvironment.createEnvironment(context)
    }
}

export const createEnvironment = new CreateEnvironmentStep('createEnvironment')