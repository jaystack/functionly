import 'reflect-metadata'

export const defineMetadata = (metadataKey, metadataValue, target, propertyKey?) => {
    return Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey)
}

export const getMetadata = (metadataKey, target) => {
    return Reflect.getMetadata(metadataKey, target)
}

export const getMetadataKeys = (target) => {
    return Reflect.getMetadataKeys(target)
}

export const getOwnMetadata = (metadataKey, target, propertyKey) => {
    return Reflect.getOwnMetadata(metadataKey, target, propertyKey)
}