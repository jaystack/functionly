import { CLASS_TAGKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const tag = (key: string, value: string) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_TAGKEY, target) || {}
        metadata[key] = value
        defineMetadata(CLASS_TAGKEY, {...metadata}, target);
    }
}