import { getFunctionName } from '../../../annotations'
import { bundle } from '../../utilities/webpack'
import { logger } from '../../utilities/logger'
import { zip } from '../../utilities/compress'
import { uploadZipStep } from '../../utilities/aws/s3Upload'
import { createStack, updateStack, getTemplate, getStackBucketName, describeStacks } from '../../utilities/aws/cloudFormation'
import { projectConfig } from '../../project/config'
import { executor } from '../../context'

import { cloudFormationInit } from './context/cloudFormationInit'
import {
    tableResources, lambdaResources, roleResources, s3BucketResources, s3BucketParameter,
    apiGateway, sns, initStacks
} from './context/resources'
import { uploadTemplate } from './context/uploadTemplate'

export const cloudFormation = {
    FUNCTIONAL_ENVIRONMENT: 'aws',
    createEnvironment: async (context) => {
        logger.info(`Functionly: Packgaging...`)
        await executor(context, bundle)
        await executor(context, zip)

        await executor(context, cloudFormationInit)
        await executor(context, s3BucketResources)

        try {
            await executor(context, getTemplate)
        } catch (e) {
            if (/^Stack with id .* does not exist$/.test(e.message)) {
                logger.info(`Functionly: Creating stack...`)

                await executor(context, createStack)
            } else {
                console.log(e)
                throw e
            }
        }
        if (!context.awsBucket) {
            await executor(context, getStackBucketName)
        }

        logger.info(`Functionly: Uploading binary...`)
        const fileName = projectConfig.name ? `${projectConfig.name}.zip` : 'project.zip'
        await executor(context, uploadZipStep(fileName, context.zipData()))

        await executor(context, initStacks)
        await executor(context, s3BucketParameter)

        await executor(context, tableResources)
        await executor(context, roleResources)
        await executor(context, lambdaResources)
        await executor(context, apiGateway)
        await executor(context, sns)

        logger.info(`Functionly: Uploading template...`)
        await executor(context, uploadTemplate)
        logger.info(`Functionly: Updating stack...`)
        await executor(context, updateStack)
        logger.info(`Functionly: Complete`)
    },
    package: async (context) => {
        logger.info(`Functionly: Packgaging...`)
        await executor(context, bundle)
        await executor(context, zip)

        await executor(context, cloudFormationInit)
        await executor(context, s3BucketResources)

        logger.info(`Functionly: Save binary...`)
        const fileName = projectConfig.name ? `${projectConfig.name}.zip` : 'project.zip'
        await executor({ ...context, skipUpload: true }, uploadZipStep(fileName, context.zipData()))

        await executor(context, initStacks)
        await executor(context, s3BucketParameter)

        await executor(context, tableResources)
        await executor(context, roleResources)
        await executor(context, lambdaResources)
        await executor(context, apiGateway)
        await executor(context, sns)

        logger.info(`Functionly: Save template...`)
        await executor({ ...context, skipUpload: true }, uploadTemplate)
        logger.info(`Functionly: Complete`)
    }
}

