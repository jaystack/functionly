import { defaultsDeep } from 'lodash'
import { __dynamoDBDefaults, getMetadata, constants } from '../../../../annotations'
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'
import { createStack, setStackParameter, getStackName } from './stack'
import { cloudFormation } from '../../../../annotations/classes/aws/cloudFormation';

export const DYNAMODB_TABLE_STACK = 'DynamoDBTableStack'

const { CLASS_CLOUDFORMATION } = constants

export const tableResources = ExecuteStep.register('DynamoDB-Tables', async (context) => {
    await executor({
        context: { ...context, stackName: DYNAMODB_TABLE_STACK },
        name: `CloudFormation-Stack-init-${DYNAMODB_TABLE_STACK}`,
        method: createStack
    })

    for (const tableConfig of context.tableConfigs) {
        await executor({
            context: { ...context, tableConfig },
            name: `DynamoDB-Table-${tableConfig.tableName}`,
            method: tableResource
        })
    }
})

export const tableResource = async (context) => {
    const { tableConfig } = context

    tableConfig.AWSTableName = tableConfig.tableName

    if (tableConfig.exists) return

    tableConfig.AWSTableName = `${tableConfig.tableName}-${context.stage}`

    const properties = {
        ...__dynamoDBDefaults,
        TableName: tableConfig.AWSTableName,
        ...tableConfig.nativeConfig
    };


    const hasSubscribers = tableConfig.services.some(s => s.serviceConfig.eventSource)
    if (hasSubscribers) {
        defaultsDeep(properties, {
            StreamSpecification: {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })
    }

    const dynamoDb = {
        "Type": "AWS::DynamoDB::Table",
        "Properties": properties
    }

    tableConfig.tableStackName = DYNAMODB_TABLE_STACK
    let tableResourceName = `Dynamo${tableConfig.tableName}`

    const cloudFormationConfig = getMetadata(CLASS_CLOUDFORMATION, tableConfig.definedBy)
    if (cloudFormationConfig) {
        tableConfig.tableStackName = cloudFormationConfig.stack
        tableResourceName = cloudFormationConfig.resourceName || tableResourceName
    }

    const resourceName = setResource(context, tableResourceName, dynamoDb, tableConfig.tableStackName, true)

    await setStackParameter({
        ...context,
        resourceName,
        sourceStackName: tableConfig.tableStackName
    })

    tableConfig.resourceName = resourceName

}

export const tableSubscribers = ExecuteStep.register('DynamoDB-Table-Subscriptions', async (context) => {
    for (const tableConfig of context.tableConfigs) {
        const subscribers = tableConfig.services.filter(s => s.serviceConfig.eventSource)
        for (const subscriber of subscribers) {
            await executor({
                context: { ...context, tableConfig, subscriber },
                name: `DynamoDB-Table-Subscriptions-${tableConfig.tableName}-${subscriber.serviceDefinition.service.name}`,
                method: tableSubscriber
            })
        }
    }
})

export const tableSubscriber = async (context) => {
    const { tableConfig, subscriber } = context

    if (tableConfig.exists) return

    const properties = {
        "BatchSize": 1,
        "EventSourceArn": {
            "Ref": `${tableConfig.resourceName}StreamArn`
        },
        "FunctionName": {
            "Fn::GetAtt": [
                subscriber.serviceDefinition.resourceName,
                "Arn"
            ]
        },
        "StartingPosition": "TRIM_HORIZON"
    };

    const dynamoDb = {
        "Type": "AWS::Lambda::EventSourceMapping",
        "Properties": properties
    }

    await setStackParameter({
        ...context,
        resourceName: tableConfig.resourceName,
        sourceStackName: tableConfig.tableStackName,
        targetStackName: getStackName(subscriber.serviceDefinition),
        attr: 'StreamArn'
    })

    const eventSourceResourceName = `EventSource${tableConfig.tableName}${subscriber.serviceDefinition.resourceName}Subscription`
    const resourceName = setResource(context, eventSourceResourceName, dynamoDb, getStackName(subscriber.serviceDefinition))

    await executor({
        context: { ...context, tableConfig, serviceDefinition: subscriber.serviceDefinition },
        name: `DynamoDB-Table-Streaming-Policy-${tableConfig.tableName}-${subscriber.serviceDefinition.service.name}`,
        method: dynamoStreamingPolicy
    })
}

export const dynamoStreamingPolicy = async (context) => {
    const { tableConfig, serviceDefinition } = context

    if (tableConfig.exists) return

    let policy = serviceDefinition.roleResource.Properties.Policies.find(p => p.PolicyDocument.Statement[0].Action.includes('dynamodb:GetRecords'))
    if (!policy) {
        policy = {
            "PolicyName": {
                "Fn::Join": [
                    "-",
                    [
                        "functionly",
                        serviceDefinition.roleName,
                        "dynamo",
                        "streams"
                    ]
                ]
            },
            "PolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": []
                }]
            }
        }
        serviceDefinition.roleResource.Properties.Policies = serviceDefinition.roleResource.Properties.Policies || []
        serviceDefinition.roleResource.Properties.Policies.push(policy)
    }

    policy.PolicyDocument.Statement[0].Resource.push({
        "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/" + tableConfig.AWSTableName + "/stream/*"
    })
}
