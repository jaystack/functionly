import 'reflect-metadata'

export const defineMetadata = (metadataKey, metadataValue, target, propertyKey?) => {
    return Reflect.defineMetadata(metadataKey, metadataValue, target.prototype ? target.prototype : target, propertyKey)
}

export const getMetadata = (metadataKey, target, propertyKey?) => {
    return Reflect.getMetadata(metadataKey, target.prototype ? target.prototype : target, propertyKey)
}

export const getMetadataKeys = (target) => {
    return Reflect.getMetadataKeys(target.prototype ? target.prototype : target)
}

export const getOwnMetadata = (metadataKey, target, propertyKey?) => {
    return Reflect.getOwnMetadata(metadataKey, target.prototype ? target.prototype : target, propertyKey)
}