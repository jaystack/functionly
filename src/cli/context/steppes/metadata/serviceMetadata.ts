import { getMetadata, constants, __dynamoDBDefaults, getMetadataKeys } from '../../../../annotations'
import { ExecuteStep } from '../../core/executeStep'

export class ServiceMetadata extends ExecuteStep {
    public async method(context) {
        context.serviceMetadata = []

        for (const serviceDefinition of context.publishedFunctions) {
            const metadataKeys = getMetadataKeys(serviceDefinition.service)
            const metadata = {}
            for (const key of metadataKeys) {
                metadata[key] = getMetadata(key, serviceDefinition.service)
            }

            context.serviceMetadata.push({
                serviceDefinition,
                metadata
            })
        }
    }
}


export const serviceMetadata = new ServiceMetadata('ServiceMetadata')
