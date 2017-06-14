import { getFunctionName } from '../../../annotations'
import { bundle } from '../../utilities/webpack'
import { logger } from '../../utilities/logger'
import { zip } from '../../utilities/compress'
import { uploadZipStep } from '../../utilities/aws/s3Upload'
import { createStack, updateStack, getTemplate, getStackBucketName, describeStacks } from '../../utilities/aws/cloudFormation'
import { projectConfig } from '../../project/config'

import { cloudFormationInit } from './context/cloudFormationInit'
import { tableResources, lambdaResources, roleResources, s3BucketResources, apiGateway } from './context/resources'
import { uploadTemplate } from './context/uploadTemplate'

export const cloudFormation = {
    FUNCTIONAL_ENVIRONMENT: 'aws',
    createEnvironment: async (context) => {
        logger.info(`Functionly: Packgaging...`)
        await context.runStep(bundle)
        await context.runStep(zip)

        await context.runStep(cloudFormationInit)
        await context.runStep(s3BucketResources)

        try {
            await context.runStep(getTemplate)
        } catch (e) {
            if (/^Stack with id .* does not exist$/.test(e.message)) {
                logger.info(`Functionly: Creating stack...`)

                await context.runStep(createStack)
            } else {
                console.log(e)
                throw e
            }
        }
        if (!context.awsBucket) {
            await context.runStep(getStackBucketName)
        }

        logger.info(`Functionly: Uploading binary...`)
        const localName = projectConfig.name ? `${projectConfig.name}.zip` : 'project.zip'
        await context.runStep(uploadZipStep(`services-${context.date.toISOString()}.zip`, context.zipData(), localName))

        await context.runStep(roleResources)
        await context.runStep(tableResources)
        await context.runStep(lambdaResources)
        await context.runStep(apiGateway)

        logger.info(`Functionly: Uploading template...`)
        await context.runStep(uploadTemplate)
        logger.info(`Functionly: Updating stack...`)
        await context.runStep(updateStack)
        logger.info(`Functionly: Complete`)
    }
}

