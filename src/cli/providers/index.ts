import { aws as awssdk } from './aws'
import { local } from './local'
import { cloudFormation as aws } from './cloudFormation'
import { azure } from './azureARM'
import { ExecuteStep, executor } from '../context'
import { getPluginDefinitions } from '../project/config'

let environments = { aws, local, awssdk, azure }

export class CreateEnvironmentStep extends ExecuteStep {
    public async method(context) {
        let currentEnvironment = environments[context.deployTarget]

        if (!currentEnvironment) {
            const plugins = getPluginDefinitions()
            for (const plugin of plugins) {
                if (plugin.config.deployProviders &&
                    plugin.config.deployProviders[context.deployTarget] &&
                    plugin.config.deployProviders[context.deployTarget].createEnvironment
                ) {
                    currentEnvironment = plugin.config.deployProviders[context.deployTarget]
                    break;
                }
            }
        }


        if (!currentEnvironment) {
            throw new Error(`unhandled deploy target: '${context.deployTarget}'`)
        }

        if (currentEnvironment.FUNCTIONAL_ENVIRONMENT) {
            context.FUNCTIONAL_ENVIRONMENT = currentEnvironment.FUNCTIONAL_ENVIRONMENT
            await executor(context, ExecuteStep.get('SetFunctionalEnvironment'))
        }

        if (context.packageOnly) {
            if (currentEnvironment.package) {
                await executor(context, currentEnvironment.package)
            } else {
                throw new Error('package creation not implemented')
            }
        } else {
            await executor(context, currentEnvironment.createEnvironment)
        }
    }
}

export const createEnvironment = new CreateEnvironmentStep('CreateEnvironment')