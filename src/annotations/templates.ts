export const applyTemplates = (key, value, target) => {
    let templatedKey = key;
    let templatedValue = value;
    for (let template of templates) {
        if (template.regexp.test(templatedKey)) {
            templatedKey = templatedKey.replace(template.regexp, template.resolution(target))
        }
        if (template.regexp.test(templatedValue)) {
            templatedValue = templatedValue.replace(template.regexp, template.resolution(target))
        }
    }

    return { templatedKey, templatedValue }
}

export const templates = [
    {
        name: 'ClassName',
        regexp: /%ClassName%/g,
        resolution: (target) => target.name
    }
]