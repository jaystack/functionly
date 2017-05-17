
import { bundle } from '../utilities/webpack'
import { zip } from '../utilities/compress'
import { upload } from '../utilities/aws/s3Upload'
import { collectAndCreateTables } from '../utilities/aws/dynamoDB'
import {
    getLambdaFunction,
    deleteLambdaFunction,
    createLambdaFunction,
    publishLambdaFunction,
    updateLambdaFunctionCode
} from '../utilities/aws/lambda'


export const createEnvironment = async (context) => {
    await bundle(context)
    await zip(context)
    await upload(context)
    await collectAndCreateTables(context)

    for (let serviceDefinition of context.publishedFunctions) {
        const serviceName = serviceDefinition.service.name
        if (serviceName) {

            console.log(`${serviceName} deploying...`)
            try {
                await getLambdaFunction(serviceDefinition, context)
                await updateLambdaFunctionCode(serviceDefinition, context)
            } catch (e) {
                await createLambdaFunction(serviceDefinition, context)
            }

            console.log('completed')
        }
    }
}


