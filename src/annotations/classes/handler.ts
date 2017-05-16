import { Class_NameKey, Class_MemorySizeKey, Class_TimeoutKey } from '../constants'
import { defineMetadata } from '../metadata'

export const handler = (memorySize?: number, timeout?: number) => {
    return (target: Function) => {
        defineMetadata(Class_NameKey, target.name, target);
        if (typeof memorySize === 'number') {
            defineMetadata(Class_MemorySizeKey, memorySize, target);
        }
        if (typeof timeout === 'number') {
            defineMetadata(Class_TimeoutKey, timeout, target);
        }
    }
}