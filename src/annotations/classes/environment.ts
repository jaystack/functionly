import { CLASS_ENVIRONMENTKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'

export const environment = (key: string, value: string) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}

        const { templatedKey, templatedValue } = applyTemplates(key, value, target)

        metadata[templatedKey] = templatedValue
        defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
    }
}
