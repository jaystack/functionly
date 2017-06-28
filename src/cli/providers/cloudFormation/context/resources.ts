import { intersection } from 'lodash'
import { getMetadata, constants, getFunctionName, __dynamoDBDefaults } from '../../../../annotations'
const { CLASS_DESCRIPTIONKEY, CLASS_ROLEKEY, CLASS_MEMORYSIZEKEY, CLASS_RUNTIMEKEY, CLASS_TIMEOUTKEY,
    CLASS_ENVIRONMENTKEY, CLASS_TAGKEY, CLASS_APIGATEWAYKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'
import { createStack, setStackParameter, getStackName } from './stack'
import { getBucketReference } from './s3Storage'

export { s3DeploymentBucket, s3DeploymentBucketParameter, s3, S3_DEPLOYMENT_BUCKET_RESOURCE_NAME } from './s3Storage'
export { apiGateway } from './apiGateway'
export { sns } from './sns'

export const DYNAMODB_TABLE_STACK = 'DynamoDBTableStack'


export const initStacks = ExecuteStep.register('CloudFormation-Stack-init', async (context) => {
    for (const serviceDefinition of context.publishedFunctions) {
        const stackName = getStackName(serviceDefinition)
        await executor({
            context: { ...context, stackName },
            name: `CloudFormation-Stack-init-${stackName}`,
            method: createStack
        })
    }
})

export const roleResources = ExecuteStep.register('IAM-Role', async (context) => {
    const roleMap = new Map<string, any[]>()
    for (const serviceDefinition of context.publishedFunctions) {
        let role = getMetadata(CLASS_ROLEKEY, serviceDefinition.service)
        if (typeof role === 'string' && /^arn:/.test(role)) {
            continue
        }
        if (!role) {
            role = context.CloudFormationConfig.StackName
        }
        if (!roleMap.has(role)) {
            roleMap.set(role, [serviceDefinition])
        }

        const roleDef = roleMap.get(role)
        roleDef.push(serviceDefinition)
    }

    for (const [roleName, serviceDefinitions] of roleMap) {
        await executor({
            context: { ...context, roleName, serviceDefinitions },
            name: `IAM-Role-${roleName}`,
            method: roleResource
        })
    }
})

export const roleResource = async (context) => {

    const { roleName, serviceDefinitions } = context

    const roleProperties = {
        "RoleName": `${roleName}-${context.stage}`,
        "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": ["lambda.amazonaws.com"]
                },
                "Action": ["sts:AssumeRole"]
            }]
        },
        "Path": "/",
        "Policies": []
    }

    await executor({
        context: { ...context, roleName, serviceDefinitions, roleProperties },
        name: `IAM-Lambda-Policy-${roleName}`,
        method: lambdaPolicy
    })

    await executor({
        context: { ...context, roleName, serviceDefinitions, roleProperties },
        name: `IAM-Log-Policy-${roleName}`,
        method: logPolicy
    })

    await executor({
        context: { ...context, roleName, serviceDefinitions, roleProperties },
        name: `IAM-Dynamo-Policy-${roleName}`,
        method: dynamoPolicy
    })

    if (roleProperties.Policies.length) {
        const iamRole = {
            "Type": "AWS::IAM::Role",
            "Properties": roleProperties
        }


        const roleResourceName = `IAM${roleName}`
        const resourceName = setResource(context, roleResourceName, iamRole)

        await setStackParameter({
            ...context,
            resourceName,
            attr: 'Arn'
        })

        context.CloudFormationConfig.Capabilities = context.CloudFormationConfig.Capabilities || [
            "CAPABILITY_NAMED_IAM"
        ]

        for (const serviceDefinition of serviceDefinitions) {
            serviceDefinition[CLASS_ROLEKEY] = {
                "Ref": `${resourceName}Arn`
            }
            serviceDefinition.roleResource = iamRole
            serviceDefinition.roleName = roleName
        }
    }
}

export const lambdaPolicy = async (context) => {
    const { roleName, roleProperties } = context
    const policy = {
        "PolicyName": {
            "Fn::Join": [
                "-",
                [
                    "functionly",
                    roleName,
                    "lambda"
                ]
            ]
        },
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "lambda:InvokeAsync",
                    "lambda:InvokeFunction",
                    "sns:Publish"
                ],
                "Resource": ["*"]
            }]
        }
    }
    roleProperties.Policies.push(policy)
}

export const logPolicy = async (context) => {
    const { roleName, roleProperties, serviceDefinitions } = context

    const logGroupResourceNames = serviceDefinitions.map(s => s.logGroupResourceName)
    const logGroupNames = context.deploymentResources
        .filter(r => r.type === 'AWS::Logs::LogGroup' && logGroupResourceNames.indexOf(r.resourceName) >= 0)
        .map(r => r.resource.Properties.LogGroupName)

    const policy = {
        "PolicyName": {
            "Fn::Join": [
                "-",
                [
                    "functionly",
                    roleName,
                    "logs"
                ]
            ]
        },
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                ],
                "Resource": logGroupNames.map(n => {
                    return {
                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:" + n + ":*"
                    }
                })
            }, {
                "Effect": "Allow",
                "Action": [
                    "logs:PutLogEvents"
                ],
                "Resource": logGroupNames.map(n => {
                    return {
                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:" + n + ":*:*"
                    }
                })
            }]
        }
    }
    roleProperties.Policies.push(policy)
}

export const dynamoPolicy = async (context) => {
    const { roleName, serviceDefinitions, roleProperties } = context
    const tables = []
    const services = serviceDefinitions.map(s => s.service)
    const usedTableConfigs = context.tableConfigs.filter(t => intersection(t.usedBy, services).length)

    const policy = {
        "PolicyName": {
            "Fn::Join": [
                "-",
                [
                    "functionly",
                    roleName,
                    "dynamo"
                ]
            ]
        },
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": usedTableConfigs.map(t => {
                    return {
                        "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/" + t.tableName
                    }
                })
            }]
        }
    }

    if (usedTableConfigs.length) {
        roleProperties.Policies.push(policy)
    }
}


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

    const properties = {
        ...__dynamoDBDefaults,
        TableName: `${tableConfig.tableName}-${context.stage}`,
        ...tableConfig.nativeConfig
    };


    const dynamoDb = {
        "Type": "AWS::DynamoDB::Table",
        "Properties": properties
    }

    const tableResourceName = `Dynamo${tableConfig.tableName}`
    const resourceName = setResource(context, tableResourceName, dynamoDb, DYNAMODB_TABLE_STACK)
    
    await setStackParameter({
        ...context,
        resourceName,
        sourceStackName: DYNAMODB_TABLE_STACK
    })

    tableConfig.tableName = properties.TableName
    tableConfig.resourceName = resourceName

}

export const lambdaResources = ExecuteStep.register('Lambda-Functions', async (context) => {
    const awsBucket = await getBucketReference(context)

    for (const serviceDefinition of context.publishedFunctions) {
        await executor({
            context: { ...context, serviceDefinition, awsBucket },
            name: `Lambda-Function-${serviceDefinition.service.name}`,
            method: lambdaResource
        })
        await executor({
            context: { ...context, serviceDefinition },
            name: `Lambda-Version-${serviceDefinition.service.name}`,
            method: lambdaVersionResource
        })
    }
})

export const lambdaResource = async (context) => {
    const { serviceDefinition, awsBucket } = context

    const properties: any = {
        Code: {
            S3Bucket: awsBucket,
            S3Key: context.S3Zip
        },
        Description: serviceDefinition[CLASS_DESCRIPTIONKEY] || getMetadata(CLASS_DESCRIPTIONKEY, serviceDefinition.service),
        FunctionName: `${getFunctionName(serviceDefinition.service)}-${context.stage}`,
        Handler: serviceDefinition.handler,
        MemorySize: serviceDefinition[CLASS_MEMORYSIZEKEY] || getMetadata(CLASS_MEMORYSIZEKEY, serviceDefinition.service),
        Role: serviceDefinition[CLASS_ROLEKEY] || getMetadata(CLASS_ROLEKEY, serviceDefinition.service),
        Runtime: serviceDefinition[CLASS_RUNTIMEKEY] || getMetadata(CLASS_RUNTIMEKEY, serviceDefinition.service) || "nodejs6.10",
        Timeout: serviceDefinition[CLASS_TIMEOUTKEY] || getMetadata(CLASS_TIMEOUTKEY, serviceDefinition.service),
        Environment: {
            Variables: serviceDefinition[CLASS_ENVIRONMENTKEY] || getMetadata(CLASS_ENVIRONMENTKEY, serviceDefinition.service)
        },
        Tags: serviceDefinition[CLASS_TAGKEY] || getMetadata(CLASS_TAGKEY, serviceDefinition.service)
    };

    updateEnvironmentVariable({ ...context, environments: properties.Environment.Variables })

    const lambdaResource = {
        "Type": "AWS::Lambda::Function",
        "Properties": properties,
        "DependsOn": [
            serviceDefinition.logGroupResourceName
        ]
    }

    const resourceName = `Lambda${getFunctionName(serviceDefinition.service)}`
    const name = setResource(context, resourceName, lambdaResource, getStackName(serviceDefinition))
    serviceDefinition.resourceName = name
}

export const lambdaVersionResource = async (context) => {
    const { serviceDefinition } = context

    const versionResource = {
        "Type": "AWS::Lambda::Version",
        "DeletionPolicy": "Retain",
        "Properties": {
            "FunctionName": {
                "Ref": serviceDefinition.resourceName
            },
            "CodeSha256": context.zipCodeSha256
        }
    }
    setResource(context, `${serviceDefinition.resourceName}${context.zipCodeSha256}`, versionResource, getStackName(serviceDefinition))
}

export const lambdaLogResources = ExecuteStep.register('Lambda-LogGroups', async (context) => {
    for (const serviceDefinition of context.publishedFunctions) {
        await executor({
            context: { ...context, serviceDefinition },
            name: `Lambda-Function-${serviceDefinition.service.name}`,
            method: lambdaLogResource
        })
    }
})

export const lambdaLogResource = async (context) => {
    const { serviceDefinition } = context

    const functionName = getFunctionName(serviceDefinition.service)

    const properties: any = {
        "LogGroupName": `/aws/lambda/${functionName}-${context.stage}`
    };

    const lambdaResource = {
        "Type": "AWS::Logs::LogGroup",
        "Properties": properties
    }

    const resourceName = `${functionName}LogGroup`
    const name = setResource(context, resourceName, lambdaResource, getStackName(serviceDefinition))
    serviceDefinition.logGroupResourceName = name
}

const UPDATEABLE_ENVIRONMENT_REGEXP = /^FUNCTIONAL_SERVICE_|_TABLE_NAME$|_S3_BUCKET$|_SNS_TOPICNAME$/
const updateEnvironmentVariable = async ({ environments, stage }) => {
    if (environments) {
        for (const key in environments) {
            if (UPDATEABLE_ENVIRONMENT_REGEXP.test(key)) {
                environments[key] = `${environments[key]}-${stage}`
            }
        }
    }
}