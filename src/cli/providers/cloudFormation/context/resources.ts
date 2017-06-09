import { merge } from 'lodash'
import { getMetadata, constants, getFunctionName, __dynamoDBDefaults } from '../../../../annotations'
const { CLASS_DESCRIPTIONKEY, CLASS_ROLEKEY, CLASS_MEMORYSIZEKEY, CLASS_RUNTIMEKEY, CLASS_TIMEOUTKEY,
    CLASS_ENVIRONMENTKEY, CLASS_TAGKEY } = constants
import { ContextStep } from '../../../context'

export const nameReplaceRegexp = /[^a-zA-Z0-9]/g
export const normalizeName = (name: string) => {
    const result = name.replace(nameReplaceRegexp, '')
    if (!result) {
        throw new Error(`'invalid name '${name}'`)
    }
    return result
}

export const setResource = (context, name, resource) => {
    if (!name) {
        throw new Error(`invalid resource name '${name}'`)
    }
    name = normalizeName(name)
    if (context.CloudFormationTemplate.Resources[name]) {
        throw new Error(`resource name '${name}' already exists`)
    }

    context.usedAwsResources = context.usedAwsResources || [];
    if (context.usedAwsResources.indexOf(resource.Type) < 0) {
        context.usedAwsResources.push(resource.type)
    }

    context.CloudFormationTemplate.Resources[name] = resource
    return name;
}

export const roleResources = ContextStep.register('roleResources', async (context) => {
    const roleMap = new Map<string, any>()


    for (const serviceDefinition of context.publishedFunctions) {


        let role = getMetadata(CLASS_ROLEKEY, serviceDefinition.service)
        if (typeof role === 'string' && /^arn:/.test(role)) {
            continue
        }

        if (!role) {
            role = context.CloudFormationConfig.StackName
        }

        if (!roleMap.has(role)) {

            const properties = {
                "RoleName": role,
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
                "Policies": [{
                    "PolicyName": {
                        "Fn::Join": [
                            "-",
                            [
                                "functionly",
                                role,
                                "lambda"
                            ]
                        ]
                    },
                    "PolicyDocument": {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": ["*"]
                            }, {
                                "Effect": "Allow",
                                "Action": [
                                    "lambda:InvokeAsync",
                                    "lambda:InvokeFunction"
                                ],
                                "Resource": ["*"]
                            }, {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:Query",
                                    "dynamodb:Scan",
                                    "dynamodb:GetItem",
                                    "dynamodb:PutItem",
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": [
                                    {
                                        "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/*"
                                    }
                                ]
                            }]
                    }
                }]
            }

            const tableResource = {
                "Type": "AWS::IAM::Role",
                "Properties": properties
            }


            const roleResourceName = `iam_${properties.RoleName}`
            const resourceName = setResource(context, roleResourceName, tableResource)
            roleMap.set(role, {
                ref: {
                    "Fn::GetAtt": [
                        resourceName,
                        "Arn"
                    ]
                },
                resourceName
            })

            context.CloudFormationConfig.Capabilities = context.CloudFormationConfig.Capabilities || [
                "CAPABILITY_NAMED_IAM"
            ]
        }

        const iam_role = roleMap.get(role)
        serviceDefinition[CLASS_ROLEKEY] = iam_role.ref

    }

})

export const tableResources = ContextStep.register('tableResources', async (context) => {

    for (const tableConfig of context.tableConfigs) {

        const properties = merge({}, {
            TableName: tableConfig.tableName
        }, tableConfig.nativeConfig, __dynamoDBDefaults);


        const tableResource = {
            "Type": "AWS::DynamoDB::Table",
            "Properties": properties
        }


        const resourceName = `dynamo_${properties.TableName}`
        setResource(context, resourceName, tableResource)
    }

})

export const lambdaResources = ContextStep.register('lambdaResources', async (context) => {
    const awsBucket = context.__userAWSBucket ? context.awsBucket : {
        "Ref": "FunctionlyDeploymentBucket"
    }


    for (const serviceDefinition of context.publishedFunctions) {

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

        const resourceName = `lambda_${properties.FunctionName}`
        const name = setResource(context, resourceName, lambdaResource)


        const versionResource = {
            "Type": "AWS::Lambda::Version",
            "DeletionPolicy": "Retain",
            "Properties": {
                "FunctionName": {
                    "Ref": name
                },
                "CodeSha256": context.zipCodeSha256
            }
        }
        setResource(context, `${name}${context.zipCodeSha256}`, versionResource)

    }

})

export const s3BucketResources = ContextStep.register('s3BucketResources', async (context) => {
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
