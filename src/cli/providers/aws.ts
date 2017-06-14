import { getFunctionName } from '../../annotations'
import { bundle } from '../utilities/webpack'
import { zip } from '../utilities/compress'
import { uploadZipStep } from '../utilities/aws/s3Upload'
import { createTables } from '../utilities/aws/dynamoDB'
import {
    getLambdaFunction,
    deleteLambdaFunction,
    createLambdaFunction,
    publishLambdaFunction,
    updateLambdaFunctionCode,
    updateLambdaFunctionConfiguration,
    updateLambdaFunctionTags
} from '../utilities/aws/lambda'
import { ExecuteStep, executor } from '../context'
import { projectConfig } from '../project/config'

export const aws = {
    FUNCTIONAL_ENVIRONMENT: 'aws',
    createEnvironment: ExecuteStep.register('CreateEnvironment_aws', async (context) => {
        await executor(context, bundle)
        await executor(context, zip)
        const localName = projectConfig.name ? `${projectConfig.name}.zip` : 'project.zip'
        await executor(context, uploadZipStep(`services-${context.date.toISOString()}.zip`, context.zipData(), localName))
        await executor(context, createTables)

        for (let serviceDefinition of context.publishedFunctions) {
            const serviceName = getFunctionName(serviceDefinition.service)
            if (serviceName) {
                console.log(`${serviceName} deploying...`)
                context.serviceDefinition = serviceDefinition
                try {
                    await executor(context, getLambdaFunction)
                    await executor(context, updateLambdaFunctionCode)
                    await executor(context, updateLambdaFunctionConfiguration)
                    await executor(context, updateLambdaFunctionTags)
                } catch (e) {
                    if (e.code === "ResourceNotFoundException") {
                        await executor(context, createLambdaFunction)
                    } else {
                        throw e
                    }
                }
                delete context.serviceDefinition

                console.log('completed')
            }
        }
    })
}
