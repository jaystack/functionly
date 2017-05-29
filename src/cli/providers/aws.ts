import { getFunctionName } from '../../annotations'
import { bundle } from '../utilities/webpack'
import { zip } from '../utilities/compress'
import { uploadZip } from '../utilities/aws/s3Upload'
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

export const FUNCTIONAL_ENVIRONMENT = 'aws'

export const createEnvironment = async (context) => {
    const date = new Date()
    await bundle(context)
    await zip(context)
    await uploadZip(context, `services-${date.toISOString()}.zip`, context.zipData())
    await createTables(context)

    for (let serviceDefinition of context.publishedFunctions) {
        const serviceName = getFunctionName(serviceDefinition.service)
        if (serviceName) {

            console.log(`${serviceName} deploying...`)
            try {
                await getLambdaFunction(serviceDefinition, context)
                await updateLambdaFunctionCode(serviceDefinition, context)
                await updateLambdaFunctionConfiguration(serviceDefinition, context)
                await updateLambdaFunctionTags(serviceDefinition, context)
            } catch (e) {
                if (e.code === "ResourceNotFoundException") {
                    await createLambdaFunction(serviceDefinition, context)
                } else {
                    throw e
                }
            }

            console.log('completed')
        }
    }
}


