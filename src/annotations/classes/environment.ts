import { Class_EnvironmentKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const environment = (key: string, value: string) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_EnvironmentKey, target) || {}

        const { templatedKey, templatedValue } = applyTemplates(key, value, target)

        metadata[templatedKey] = templatedValue
        defineMetadata(Class_EnvironmentKey, { ...metadata }, target);
    }
}

export const applyTemplates = (key, value, target) => {
    let templatedKey = key;
    let templatedValue = value;
    for (let template of environmentTemplates) {
        if (template.regexp.test(templatedKey)) {
            templatedKey = templatedKey.replace(template.regexp, template.resolution(target))
        }
        if (template.regexp.test(templatedValue)) {
            templatedValue = templatedValue.replace(template.regexp, template.resolution(target))
        }
    }

    return { templatedKey, templatedValue }
}

export const environmentTemplates = [
    {
        name: 'ClassName',
        regexp: /%ClassName%/g,
        resolution: (target) => target.name
    }
]
