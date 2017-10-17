import { getMetadata, constants } from '../../annotations'
const { CLASS_ENVIRONMENTKEY } = constants

export const collectMetadata = (context, config: {
    metadataKey?: string,
    selector?: (c) => string
}) => {
    const result = new Map()
    for (const serviceDefinition of context.publishedFunctions) {
        if (config.metadataKey && config.selector) {
            let partialConfigs = (getMetadata(config.metadataKey, serviceDefinition.service) || [])
            for (const serviceConfig of partialConfigs) {
                const hash = config.selector(serviceConfig)

                if (result.has(hash)) {
                    const item = result.get(hash)
                    item.services.push({ serviceDefinition, serviceConfig })
                    continue
                }

                result.set(hash, {
                    ...serviceConfig,
                    hash,
                    services: [{ serviceDefinition, serviceConfig }]
                })
            }
        }
    }

    return Array.from(result.values())
}
