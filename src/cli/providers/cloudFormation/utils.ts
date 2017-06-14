export const nameReplaceRegexp = /[^a-zA-Z0-9]/g
export const normalizeName = (name: string) => {
    const result = name.replace(nameReplaceRegexp, '')
    if (!result) {
        throw new Error(`'invalid name '${name}'`)
    }
    return result
}

export const setResource = (context, name, resource, allowOverride = false) => {
    if (!name) {
        throw new Error(`invalid resource name '${name}'`)
    }
    name = normalizeName(name)
    if (allowOverride === false && context.CloudFormationTemplate.Resources[name]) {
        throw new Error(`resource name '${name}' already exists`)
    }

    context.usedAwsResources = context.usedAwsResources || [];
    if (context.usedAwsResources.indexOf(resource.Type) < 0) {
        context.usedAwsResources.push(resource.type)
    }

    context.CloudFormationTemplate.Resources[name] = resource

    if (Array.isArray(context.deploymentResources)) {
        context.deploymentResources.push({
            name,
            type: resource.Type
        })
    }

    return name;
}