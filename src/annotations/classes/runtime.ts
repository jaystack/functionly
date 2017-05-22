import { CLASS_MEMORYSIZEKEY, CLASS_TIMEOUTKEY, CLASS_RUNTIMEKEY } from '../constants'
import { defineMetadata } from '../metadata'

export const runtime = (config: {
    type?: 'nodejs6.10',
    memorySize?: number,
    timeout?: number
}) => (target: Function) => {
    if (typeof config.type === 'string') {
        defineMetadata(CLASS_RUNTIMEKEY, config.type, target);
    }
    if (typeof config.memorySize === 'number') {
        defineMetadata(CLASS_MEMORYSIZEKEY, config.memorySize, target);
    }
    if (typeof config.timeout === 'number') {
        defineMetadata(CLASS_TIMEOUTKEY, config.timeout, target);
    }
}