import { Class_LogKey } from '../constants'
import { defineMetadata } from '../metadata'

export const log = (config?) => (target: Function) => {
    defineMetadata(Class_LogKey, true, target);
}