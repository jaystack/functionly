import { CLASS_CLASSCONFIGKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const classConfig = (config: { [key: string]: any }) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_CLASSCONFIGKEY, target) || {}
        defineMetadata(CLASS_CLASSCONFIGKEY, { ...metadata, ...config }, target);
    }
}

export const getClassConfigValue = (key: string, target) => {
    return (getMetadata(CLASS_CLASSCONFIGKEY, target) || {})[key]
}