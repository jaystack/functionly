import { Class_MemorySizeKey, Class_TimeoutKey, Class_RuntimeKey } from '../constants'
import { defineMetadata } from '../metadata'

export const runtime = (config: {
    type?: 'nodejs6.10',
    memorySize?: number,
    timeout?: number
}) => (target: Function) => {
    if (typeof config.type === 'string') {
        defineMetadata(Class_RuntimeKey, config.type, target);
    }
    if (typeof config.memorySize === 'number') {
        defineMetadata(Class_MemorySizeKey, config.memorySize, target);
    }
    if (typeof config.timeout === 'number') {
        defineMetadata(Class_TimeoutKey, config.timeout, target);
    }
}