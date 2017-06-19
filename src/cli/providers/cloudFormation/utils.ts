export const nameReplaceRegexp = /[^a-zA-Z0-9]/g
export const normalizeName = (name: string) => {
    const result = name.replace(nameReplaceRegexp, '')
    if (!result) {
        throw new Error(`'invalid name '${name}'`)
    }
    return result
}

export const getResourceName = (name) => {
    if (!name) {
        throw new Error(`invalid resource name '${name}'`)
    }
    return normalizeName(name)
}

export const setResource = (context: any, name: string, resource: any, stackName: string = null, allowOverride = false) => {
    const resourceName = getResourceName(name)

    let resources
    let outputs
    if (stackName) {
        if (context.CloudFormationStacks[stackName]) {
            resources = context.CloudFormationStacks[stackName].Resources
            outputs = context.CloudFormationStacks[stackName].Outputs
        }
    } else {
        resources = context.CloudFormationTemplate.Resources
    }

    if (!resources) {
        throw new Error(`Stack with name '${stackName}' not defined`)
    }

    if (allowOverride === false && resources[resourceName]) {
        throw new Error(`resource name '${resourceName}' already exists`)
    }

    context.usedAwsResources = context.usedAwsResources || [];
    if (context.usedAwsResources.indexOf(resource.Type) < 0) {
        context.usedAwsResources.push(resource.type)
    }

    resources[resourceName] = resource
    if (outputs) {
        outputs[resourceName] = {
            "Value": {
                "Ref": resourceName
            }
        }
    }

    if (Array.isArray(context.deploymentResources)) {
        context.deploymentResources.push({
            resourceName,
            type: resource.Type,
            stackName,
            resource
        })
    }

    return resourceName;
}