import { getMetadata, constants, defineMetadata } from '../../../../annotations'
const { CLASS_SNSCONFIGURATIONKEY, CLASS_ENVIRONMENTKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { collectMetadata } from '../../../utilities/collectMetadata'
import { setResource } from '../utils'
import { createStack, setStackParameter, getStackName } from './stack'

export const SNS_TABLE_STACK = 'SNSStack'

export const sns = ExecuteStep.register('SNS', async (context) => {
    await executor({
        context: { ...context, stackName: SNS_TABLE_STACK },
        name: `CloudFormation-Stack-init-${SNS_TABLE_STACK}`,
        method: createStack
    })

    await executor(context, snsTopics)
})

export const snsTopics = ExecuteStep.register('SNS-Topics', async (context) => {
    const configs = collectMetadata(context, {
        metadataKey: CLASS_SNSCONFIGURATIONKEY,
        selector: (c) => c.topicName
    })

    for (const snsConfig of configs) {
        await executor({
            context: { ...context, snsConfig },
            name: `SNS-Topic-${snsConfig.topicName}`,
            method: snsTopic
        })

        await executor({
            context: { ...context, snsConfig },
            name: `SNS-Topic-Subscription-${snsConfig.topicName}`,
            method: snsTopicSubscriptions
        })
    }
})

export const snsTopic = async (context) => {
    const { snsConfig } = context

    snsConfig.ADVTopicName = snsConfig.topicName
    snsConfig.AWSTopicName = snsConfig.topicName

    if (!snsConfig.exists) {

        snsConfig.ADVTopicName = `${snsConfig.topicName}${context.date.valueOf()}`
        snsConfig.AWSTopicName = `${snsConfig.ADVTopicName}-${context.stage}`

        const snsProperties = {
            "TopicName": snsConfig.AWSTopicName
        }

        const snsTopic = {
            "Type": "AWS::SNS::Topic",
            "Properties": snsProperties
        }

        const resourceName = `SNS${snsConfig.ADVTopicName}`
        const topicResourceName = setResource(context, resourceName, snsTopic, SNS_TABLE_STACK)
        snsConfig.resourceName = topicResourceName
    }

    await executor({
        context,
        name: `SNS-Topic-${snsConfig.topicName}-DynamicName`,
        method: updateSNSEnvironmentVariables
    })
}

export const snsTopicSubscriptions = async (context) => {
    const { snsConfig } = context

    if (snsConfig.exists) return

    for (const { serviceDefinition, serviceConfig } of snsConfig.services) {
        if (!serviceConfig.eventSource) continue

        await executor({
            context: { ...context, serviceDefinition },
            name: `SNS-Topic-Subscription-${snsConfig.topicName}-${serviceDefinition.service.name}`,
            method: snsTopicSubscription
        })

        await executor({
            context: { ...context, serviceDefinition },
            name: `SNS-Topic-Permission-${snsConfig.topicName}-${serviceDefinition.service.name}`,
            method: snsPermissions
        })
    }
}

export const snsTopicSubscription = async (context) => {
    const { serviceDefinition, snsConfig } = context

    if (snsConfig.exists) return

    await setStackParameter({
        ...context,
        sourceStackName: SNS_TABLE_STACK,
        resourceName: snsConfig.resourceName,
        targetStackName: getStackName(serviceDefinition)
    })

    const snsProperties = {
        "Endpoint": {
            "Fn::GetAtt": [serviceDefinition.resourceName, "Arn"]
        },
        "Protocol": "lambda",
        "TopicArn": {
            "Ref": snsConfig.resourceName
        }
    }

    const snsTopic = {
        "Type": "AWS::SNS::Subscription",
        "Properties": snsProperties
    }

    const resourceName = `SNS${serviceDefinition.resourceName}${snsConfig.resourceName}`
    const topicResourceName = setResource(context, resourceName, snsTopic, getStackName(serviceDefinition))
}

export const snsPermissions = (context) => {
    const { serviceDefinition, snsConfig } = context

    if (snsConfig.exists) return

    const properties = {
        "FunctionName": {
            "Fn::GetAtt": [
                serviceDefinition.resourceName,
                "Arn"
            ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "sns.amazonaws.com",
        "SourceArn": { "Ref": snsConfig.resourceName }
    }

    const snsPermission = {
        "Type": "AWS::Lambda::Permission",
        "Properties": properties
    }
    const resourceName = `${snsConfig.resourceName}Permission`
    setResource(context, resourceName, snsPermission, getStackName(serviceDefinition), true)
}

const updateSNSEnvironmentVariables = async (context) => {
    const { snsConfig } = context

    for (const { serviceDefinition, serviceConfig } of snsConfig.services) {
        const environmentVariables = getMetadata(CLASS_ENVIRONMENTKEY, serviceDefinition.service) || {}
        environmentVariables[serviceConfig.environmentKey] = `${snsConfig.ADVTopicName}`

        if (snsConfig.exists) {
            environmentVariables[`${serviceConfig.environmentKey}_ARN`] = {
                "Fn::Sub": "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:" + snsConfig.AWSTopicName
            }
        } else {
            await setStackParameter({
                ...context,
                sourceStackName: SNS_TABLE_STACK,
                resourceName: snsConfig.resourceName,
                targetStackName: getStackName(serviceDefinition)
            })

            environmentVariables[`${serviceConfig.environmentKey}_ARN`] = {
                "Ref": snsConfig.resourceName
            }
        }

        defineMetadata(CLASS_ENVIRONMENTKEY, { ...environmentVariables }, serviceDefinition.service)
    }

}