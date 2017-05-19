import { Class_NameKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { simpleClassAnnotation } from './simpleAnnotation'


export const functionName = simpleClassAnnotation<string>(Class_NameKey)

export const getFunctionName = (target) => {
    const value = getMetadata(Class_NameKey, target)
    if (value) {
        return value
    }
    if (target instanceof Function) {
        return target.name
    }
    if (target && target.constructor && target.constructor.name) {
        return target.constructor.name
    }

    throw new Error(`name not resolvable on '${target}'`)
}