import { CLASS_ENVIRONMENTKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { createClassDecorator, ObjectDecorator } from '../decorators'

// export const environment = (key: string, value: string) => {
//     return (target: Function) => {
//         let metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}

//         const { templatedKey, templatedValue } = applyTemplates(key, value, target)

//         metadata[templatedKey] = templatedValue
//         defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
//     }
// }

export type EnvironmentProps = { [key: string]: any }
export class EnvironmentDecorator extends ObjectDecorator<EnvironmentProps>{
    public decorator(value, metadata, target) {

        let templatedMetadataValue = {}
        for (var key in value) {
            const { templatedKey, templatedValue } = applyTemplates(key, value[key], target)
            templatedMetadataValue[templatedKey] = templatedValue
        }

        return { ...metadata, ...templatedMetadataValue }
    }
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.environmentVariables = value
    }
}
const _environment = createClassDecorator<EnvironmentProps>(new EnvironmentDecorator())
export const environment = (key, value) => _environment({ [key]: value }) 
