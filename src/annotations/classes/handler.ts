import { Class_NameKey, Class_MemorySizeKey, Class_TimeoutKey } from '../constants'
import { defineMetadata } from '../metadata'

let map = new Map()

export const handler = (memorySize?: number, timeout?: number) => {
    return (target: Function) => {
        defineMetadata(Class_NameKey, target.name, target);
        map.set(target.name, target)
        if (typeof memorySize === 'number') {
            defineMetadata(Class_MemorySizeKey, memorySize, target);
        }
        if (typeof timeout === 'number') {
            defineMetadata(Class_TimeoutKey, timeout, target);
        }
    }
}

export const resolveHandler = (handlerName) => {
    let handler = null
    if (typeof handlerName === 'function') {
        handler = map.get(handlerName.name)
    }
    if (typeof handlerName === 'string') {
        handler = map.get(handlerName)
    }

    if(!handler) throw new Error(`handler not exists '${handlerName}'`)
    return handler
}