import { getFunctionName } from '../../../annotations'
import { bundle } from '../../utilities/webpack'
import { logger } from '../../utilities/logger'
import { zip } from '../../utilities/compress'
import { writeFile } from '../../utilities/local/file'
import { projectConfig } from '../../project/config'
import { executor } from '../../context'

import { ARMInit, ARMMerge } from './context/init'
import { azureFunctions, persistAzureGithubRepo } from './context/functions'


export const azure = {
    FUNCTIONAL_ENVIRONMENT: 'azure',
    createEnvironment: async (context) => {
        throw new Error('deploy not implemented, use package command')
    },
    package: async (context) => {
        logger.info(`Functionly: Packgaging...`)
        await executor(context, bundle)
        await executor(context, zip)

        await executor(context, ARMInit)


        await executor(context, ARMMerge)
        await executor(context, azureFunctions)


        logger.info(`Functionly: Save template...`)
        await executor(context, persistAzureGithubRepo)
        await executor(context, persistFile)

        logger.info(`Functionly: Complete`)
    }
}

export const persistFile = async (context) => {
    const fileName = projectConfig.name ? `${projectConfig.name}.template.json` : 'azurearm.template.json'
    const templateData = JSON.stringify(context.ARMTemplate, null, 2);
    writeFile(fileName, new Buffer(templateData, 'binary'))
}