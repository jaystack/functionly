import { CLASS_LOGKEY } from '../constants'
import { defineMetadata } from '../metadata'

export const log = (config?) => (target: Function) => {
    defineMetadata(CLASS_LOGKEY, true, target);
}