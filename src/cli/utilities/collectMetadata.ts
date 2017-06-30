import { getMetadata, constants } from '../../annotations'
const { CLASS_ENVIRONMENTKEY } = constants

export const collectMetadata = (context, config: {
    metadataKey?: string,
    selector?: (c) => string,
    environmentRegexp?: RegExp,
    keyProperty?: string,
    valueProperty?: string,
    defaultServiceConfig?: { [key: string]: any }
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

        if (config.environmentRegexp && config.keyProperty && config.valueProperty) {
            let metadata = getMetadata(CLASS_ENVIRONMENTKEY, serviceDefinition.service)
            if (metadata) {
                let keys = Object.keys(metadata)
                for (const key of keys) {
                    const hash = metadata[key]
                    if (config.environmentRegexp.test(key)) {
                        const serviceConfig = {
                            ...(config.defaultServiceConfig || {}),
                            [config.keyProperty]: key,
                            [config.valueProperty]: hash
                        }

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
        }
    }

    return Array.from(result.values())
}
