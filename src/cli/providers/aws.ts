import { getFunctionName } from '../../annotations'
import { bundle } from '../utilities/webpack'
import { zip } from '../utilities/compress'
import { upload } from '../utilities/aws/s3Upload'
import { collectAndCreateTables } from '../utilities/aws/dynamoDB'
import {
    getLambdaFunction,
    deleteLambdaFunction,
    createLambdaFunction,
    publishLambdaFunction,
    updateLambdaFunctionCode,
    updateLambdaFunctionConfiguration,
    updateLambdaFunctionTags
} from '../utilities/aws/lambda'


export const createEnvironment = async (context) => {
    await bundle(context)
    await zip(context)
    await upload(context)
    await collectAndCreateTables(context)

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


