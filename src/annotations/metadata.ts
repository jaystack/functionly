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

export const getOverridableMetadata = (metadataKey, target, propertyKey) => {
    if (!propertyKey) {
        // parameter decorators in constructors
    } else {
        // parameter decorators in static methods
        if (target.hasOwnProperty(propertyKey)) {
            return getOwnMetadata(metadataKey, target, propertyKey)
        }
    }

    return getParentMetadata(metadataKey, target, propertyKey)
}

export const getParentMetadata = (metadataKey, target, propertyKey) => {
    if (target === Function) return
    const value = getOwnMetadata(metadataKey, target, propertyKey)
    if (typeof value === 'undefined') {
        if (target.prototype && target.__proto__) {
            return getParentMetadata(metadataKey, target.__proto__, propertyKey)
        }
        if (!target.prototype && target.constructor) {
            return getParentMetadata(metadataKey, target.constructor, propertyKey)
        }
    }
    return value
}