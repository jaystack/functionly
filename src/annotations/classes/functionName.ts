import { CLASS_NAMEKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { simpleClassAnnotation } from './simpleAnnotation'


export const functionName = simpleClassAnnotation<string>(CLASS_NAMEKEY)

export const getFunctionName = (target) => {
    const value = getMetadata(CLASS_NAMEKEY, target)
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