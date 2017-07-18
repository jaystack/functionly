import { getFunctionName } from '../../../annotations'
import { bundle } from '../../utilities/webpack'
import { logger } from '../../utilities/logger'
import { zip } from '../../utilities/compress'
import { writeFile } from '../../utilities/local/file'
import { projectConfig } from '../../project/config'
import { executor } from '../../context'

import { ARMInit, ARMMerge, initGitTemplate, persistHostJson } from './context/init'
import { azureFunctions, persistAzureGithubRepo } from './context/functions'


export const azure = {
    FUNCTIONAL_ENVIRONMENT: 'azure',
    createEnvironment: async (context) => {
        logger.info(`Functionly: Packgaging...`)
        await executor(context, bundle)
        await executor(context, zip)

        await executor(context, ARMInit)


        await executor(context, ARMMerge)
        await executor(context, azureFunctions)
        await executor(context, initGitTemplate)


        logger.info(`Functionly: Create project...`)
        await executor({ ...context, deploymentFolder: projectConfig.ARM.deploymentFolder }, persistAzureGithubRepo)
        await executor({ ...context, deploymentFolder: projectConfig.ARM.deploymentFolder }, persistHostJson)
        logger.info(`Functionly: Save template...`)
        await executor(context, persistFile)

        logger.info(`Functionly: Complete`)
    },
    package: async (context) => {
        logger.info(`Functionly: Packgaging...`)
        await executor(context, bundle)
        await executor(context, zip)

        await executor(context, ARMInit)


        await executor(context, ARMMerge)
        await executor(context, azureFunctions)
        await executor(context, initGitTemplate)


        logger.info(`Functionly: Create project...`)
        await executor(context, persistAzureGithubRepo)
        await executor(context, persistHostJson)
        logger.info(`Functionly: Save template...`)
        await executor(context, persistFile)

        logger.info(`Functionly: Complete`)
    }
}

export const persistFile = async (context) => {
    const fileName = projectConfig.name ? `${projectConfig.name}.template.json` : 'azurearm.template.json'
    const templateData = JSON.stringify(context.ARMTemplate, null, 2);
    writeFile(fileName, new Buffer(templateData, 'binary'))
}