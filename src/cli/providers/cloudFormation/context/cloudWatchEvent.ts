import { getMetadata, constants, getFunctionName } from '../../../../annotations'
const { CLASS_CLOUDWATCHEVENT } = constants
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'
import { setStackParameter, getStackName } from './stack'

export const cloudWatchEvent = ExecuteStep.register('CloudWatchEvent', async (context) => {
    await executor(context, cloudWatchResources)
})

export const cloudWatchResources = ExecuteStep.register('CloudWatchEvent-Resources', async (context) => {
    for (const serviceDefinition of context.publishedFunctions) {
        await executor({
            context: { ...context, serviceDefinition },
            name: `CloudWatchEvent-${serviceDefinition.service.name}`,
            method: cloudWatchEventItems
        })
    }
})

export const cloudWatchEventItems = async (context) => {
    const { serviceDefinition } = context

    let cloudWatches = getMetadata(CLASS_CLOUDWATCHEVENT, serviceDefinition.service) || []
    for (let [ruleIndex, rule] of cloudWatches.entries()) {
        await executor({
            context: { ...context, rule, ruleIndex },
            name: `CloudWatchEvent-Rule-${serviceDefinition.service.name}`,
            method: cloudWatchEventItem
        })
    }
}

export const cloudWatchEventItem = async (context) => {
    const { serviceDefinition, rule, ruleIndex } = context

    const properties: any = {
        "State": "ENABLED",
        "Targets": [{
            "Arn": { "Fn::GetAtt": [serviceDefinition.resourceName, "Arn"] },
            "Id": `${getFunctionName(serviceDefinition.service)}Schedule${ruleIndex}`
        }]
    }

    if (rule.scheduleExpression) {
        properties.ScheduleExpression = rule.scheduleExpression
    } else if (rule.eventPattern) {
        properties.EventPattern = rule.eventPattern
    } else {
        // invalid event configuration
        return
    }

    const methodConfig = {
        "Type": "AWS::Events::Rule",
        "Properties": properties,
        "DependsOn": [
            serviceDefinition.resourceName
        ]
    }
    const resourceName = `CloudWatchEvent${getFunctionName(serviceDefinition.service)}`
    const name = setResource(context, resourceName, methodConfig, getStackName(serviceDefinition))

    await executor({
        context: { ...context, cloudWatchResourceName: resourceName },
        name: `CloudWatchEvent-Rule-Permission-${serviceDefinition.service.name}`,
        method: cloudWatchEvenetPermission
    })
}

export const cloudWatchEvenetPermission = (context) => {
    const { serviceDefinition, cloudWatchResourceName } = context
    const properties = {
        "FunctionName": {
            "Fn::GetAtt": [
                serviceDefinition.resourceName,
                "Arn"
            ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": { "Fn::GetAtt": [cloudWatchResourceName, "Arn"] }
    }

    const methodConfig = {
        "Type": "AWS::Lambda::Permission",
        "Properties": properties,
        "DependsOn": [
            serviceDefinition.resourceName,
            cloudWatchResourceName
        ]
    }
    const resourceName = `CloudWatchEvent${serviceDefinition.resourceName}Permission`
    setResource(context, resourceName, methodConfig, getStackName(serviceDefinition), false, true)
}
