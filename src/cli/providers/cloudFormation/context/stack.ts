import { ExecuteStep, executor } from '../../../context'
import { setResource, getResourceName } from '../utils'
import { getFunctionName } from '../../../../annotations'
import { getBucketReference } from './s3Storage'

export const createStack = async (context) => {
    const { stackName } = context

    context.CloudFormationStacks[stackName] = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Parameters": {},
        "Resources": {},
        "Outputs": {}
    }

    const folderPah = context.version ? `${context.version}/${context.date.toISOString()}` : `${context.date.toISOString()}`
    const awsBucket = await getBucketReference(context)

    const properties = {
        "Parameters": {},
        "TemplateURL": {
            "Fn::Join": [
                "/",
                [
                    "https://s3.amazonaws.com",
                    awsBucket,
                    context.projectName || `functionly`,
                    context.stage,
                    folderPah,
                    `${stackName}.template.json`
                ]
            ]
        }
    }


    const stack = {
        "Type": "AWS::CloudFormation::Stack",
        "Properties": properties,
        "DependsOn": []
    }

    return setResource(context, stackName, stack)
}

export const setStackParameter = (context) => {
    const { sourceStackName, resourceName, targetStackName, attr } = context

    let parameterReference: any = {
        "Ref": resourceName
    }
    let attrName = ''

    if (sourceStackName) {
        parameterReference = {
            "Fn::GetAtt": [
                sourceStackName,
                `Outputs.${resourceName}`
            ]
        }
        if (attr) {
            attrName = attr
            parameterReference = {
                "Fn::GetAtt": [
                    sourceStackName,
                    `Outputs.${resourceName}${attr}`
                ]
            }
            context.CloudFormationStacks[sourceStackName].Outputs[`${resourceName}${attr}`] = {
                "Value": {
                    "Fn::GetAtt": [
                        resourceName,
                        attr
                    ]
                }
            }
        }
    } else if (attr) {
        attrName = attr
        parameterReference = {
            "Fn::GetAtt": [
                resourceName,
                attr
            ]
        }
    }

    for (const stackName in context.CloudFormationStacks) {
        const template = context.CloudFormationStacks[stackName]
        const stackDefinition = context.CloudFormationTemplate.Resources[stackName]
        if (stackName !== sourceStackName && (!targetStackName || targetStackName === stackName)) {
            template.Parameters[`${resourceName}${attrName}`] = {
                "Type": "String"
            }
            stackDefinition.Properties.Parameters[`${resourceName}${attrName}`] = parameterReference


            const dependsOnResourceName = sourceStackName ? sourceStackName : resourceName
            if (stackDefinition.DependsOn.indexOf(dependsOnResourceName) < 0) {
                stackDefinition.DependsOn.push(dependsOnResourceName)
            }
        }
    }

}

export const getStackName = (serviceDefinition) => {
    const resourceName = getFunctionName(serviceDefinition.service)
    return getResourceName(`Stack${resourceName}`)
}