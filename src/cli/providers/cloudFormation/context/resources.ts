import { intersection } from 'lodash'
import { getMetadata, constants, getFunctionName, __dynamoDBDefaults } from '../../../../annotations'
const { CLASS_DESCRIPTIONKEY, CLASS_ROLEKEY, CLASS_MEMORYSIZEKEY, CLASS_RUNTIMEKEY, CLASS_TIMEOUTKEY,
    CLASS_ENVIRONMENTKEY, CLASS_TAGKEY, CLASS_APIGATEWAYKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'
export { apiGateway } from './apiGateway'
export { sns } from './sns'

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
        "RoleName": roleName,
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


        const roleResourceName = `IAM${roleProperties.RoleName}`
        const resourceName = setResource(context, roleResourceName, iamRole)

        context.CloudFormationConfig.Capabilities = context.CloudFormationConfig.Capabilities || [
            "CAPABILITY_NAMED_IAM"
        ]

        for (const serviceDefinition of serviceDefinitions) {
            serviceDefinition[CLASS_ROLEKEY] = {
                "Fn::GetAtt": [
                    resourceName,
                    "Arn"
                ]
            }
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
                    "lambda:InvokeFunction"
                ],
                "Resource": ["*"]
            }]
        }
    }
    roleProperties.Policies.push(policy)
}

export const logPolicy = async (context) => {
    const { roleName, roleProperties } = context
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
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": ["*"]
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
        TableName: tableConfig.tableName,
        ...tableConfig.nativeConfig
    };

    tableConfig.tableName = properties.TableName

    const dynamoDb = {
        "Type": "AWS::DynamoDB::Table",
        "Properties": properties
    }

    const resourceName = `Dynamo${properties.TableName}`
    const name = setResource(context, resourceName, dynamoDb)

    tableConfig.resourceName = name

}

export const lambdaResources = ExecuteStep.register('Lambda-Functions', async (context) => {
    const awsBucket = context.__userAWSBucket ? context.awsBucket : {
        "Ref": "FunctionlyDeploymentBucket"
    }

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
        FunctionName: getFunctionName(serviceDefinition.service),
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

    const lambdaResource = {
        "Type": "AWS::Lambda::Function",
        "Properties": properties
    }

    const resourceName = `Lambda${properties.FunctionName}`
    const name = setResource(context, resourceName, lambdaResource)
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
    setResource(context, `${serviceDefinition.resourceName}${context.zipCodeSha256}`, versionResource)
}

export const s3BucketResources = ExecuteStep.register('S3-Bucket', async (context) => {
    if (context.awsBucket) {
        context.__userAWSBucket = true
    }

    const s3BucketResources = {
        "Type": "AWS::S3::Bucket"
    }

    const resourceName = `FunctionlyDeploymentBucket`
    const name = setResource(context, resourceName, s3BucketResources)

    context.CloudFormationTemplate.Outputs[`${name}Name`] = {
        "Value": {
            "Ref": "FunctionlyDeploymentBucket"
        }
    }

})
