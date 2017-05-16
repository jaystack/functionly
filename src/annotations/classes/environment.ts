import { Class_EnvironmentKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const environment = (key: string, value: string) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_EnvironmentKey, target) || {}

        let templatedKey = key;
        for (let template of environmentTemplates) {
            if (template.regexp.test(templatedKey)) {
                templatedKey = templatedKey.replace(template.regexp, template.resolution(target))
            }
        }

        metadata[templatedKey] = value
        defineMetadata(Class_EnvironmentKey, { ...metadata }, target);
    }
}

export const environmentTemplates = [
    {
        name: 'ClassName',
        regexp: /%ClassName%/g,
        resolution: (target) => target.name
    }
]
