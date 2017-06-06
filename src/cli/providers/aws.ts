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
import { ContextStep } from '../context'

export const aws = {
    FUNCTIONAL_ENVIRONMENT: 'aws',
    createEnvironment: ContextStep.register('createEnvironment_aws', async (context) => {
        await context.runStep(bundle)
        await context.runStep(zip)
        await context.runStep(uploadZipStep(`services-${context.date.toISOString()}.zip`, context.zipData()))
        await context.runStep(createTables)

        for (let serviceDefinition of context.publishedFunctions) {
            const serviceName = getFunctionName(serviceDefinition.service)
            if (serviceName) {
                console.log(`${serviceName} deploying...`)
                context.serviceDefinition = serviceDefinition
                try {
                    await context.runStep(getLambdaFunction)
                    await context.runStep(updateLambdaFunctionCode)
                    await context.runStep(updateLambdaFunctionConfiguration)
                    await context.runStep(updateLambdaFunctionTags)
                } catch (e) {
                    if (e.code === "ResourceNotFoundException") {
                        await context.runStep(createLambdaFunction)
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
