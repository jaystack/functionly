import { getMetadata, constants } from '../../../../annotations'
const { CLASS_SNSCONFIGURATIONKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'
import { getStackName } from './stack'

export const sns = ExecuteStep.register('SNS', async (context) => {
    await executor(context, snsTopics)
})

export const snsTopics = ExecuteStep.register('SNS-Topics', async (context) => {
    for (const serviceDefinition of context.publishedFunctions) {
        await executor({
            context: { ...context, serviceDefinition },
            name: `SNS-Topic-${serviceDefinition.service.name}`,
            method: snsTopic
        })
    }
})

export const snsTopic = async (context) => {
    const { serviceDefinition } = context
    let snsConfigs = getMetadata(CLASS_SNSCONFIGURATIONKEY, serviceDefinition.service) || []

    for (const snsConfig of snsConfigs) {
        await executor({
            context: { ...context, snsConfig },
            name: `SNS-Topic-Subscription-${serviceDefinition.service.name}-${snsConfig.topicName}`,
            method: snsTopicSubscription
        })
    }
}

export const snsTopicSubscription = async (context) => {
    const { serviceDefinition, snsConfig } = context

    const snsProperties = {
        "TopicName": snsConfig.topicName,
        "Subscription": [
            {
                "Endpoint": {
                    "Fn::GetAtt": [serviceDefinition.resourceName, "Arn"]
                },
                "Protocol": "lambda"
            }
        ]
    }

    const snsTopic = {
        "Type": "AWS::SNS::Topic",
        "Properties": snsProperties,
        "DependsOn": [serviceDefinition.resourceName]
    }

    const resourceName = `SNS${serviceDefinition.resourceName}${snsConfig.topicName}${context.date.valueOf()}`
    const topicName = setResource(context, resourceName, snsTopic, getStackName(serviceDefinition))

    await executor({
        context: { ...context, topicName },
        name: `SNS-Topic-Permission-${serviceDefinition.service.name}-${snsConfig.topicName}`,
        method: snsPermissions
    })
}

export const snsPermissions = (context) => {
    const { serviceDefinition, topicName } = context
    const properties = {
        "FunctionName": {
            "Fn::GetAtt": [
                serviceDefinition.resourceName,
                "Arn"
            ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "sns.amazonaws.com",
        "SourceArn": { "Ref": topicName }
    }

    const snsPermission = {
        "Type": "AWS::Lambda::Permission",
        "Properties": properties
    }
    const resourceName = `${topicName}Permission`
    setResource(context, resourceName, snsPermission, getStackName(serviceDefinition), true)
}