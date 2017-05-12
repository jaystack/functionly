import { Class_TagKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const tag = (key: string, value: string) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_TagKey, target) || {}
        metadata[key] = value
        defineMetadata(Class_TagKey, {...metadata}, target);
    }
}