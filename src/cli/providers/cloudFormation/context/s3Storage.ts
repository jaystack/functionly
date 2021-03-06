import { getMetadata, constants, defineMetadata, getFunctionName } from '../../../../annotations'
const { CLASS_S3CONFIGURATIONKEY, CLASS_ENVIRONMENTKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { collectMetadata } from '../../../utilities/collectMetadata'
import { setResource } from '../utils'
import { createStack, setStackParameter, getStackName } from './stack'
import { getDeploymentBucketResourceName } from './s3StorageDeployment'

export const S3_STORAGE_STACK = 'S3Stack'

export const s3DeploymentBucket = ExecuteStep.register('S3-Deployment-Bucket', async (context) => {
    if (context.awsBucket) {
        context.__userAWSBucket = true
    }

    const s3BucketResource = {
        "Type": "AWS::S3::Bucket"
    }

    const bucketResourceName = await getDeploymentBucketResourceName()
    const resourceName = setResource(context, bucketResourceName, s3BucketResource)

    context.CloudFormationTemplate.Outputs[`${resourceName}Name`] = {
        "Value": {
            "Ref": bucketResourceName
        }
    }

})


export const s3DeploymentBucketParameter = ExecuteStep.register('S3-Deployment-Bucket-Parameter', async (context) => {
    const resourceName = await getDeploymentBucketResourceName()
    await setStackParameter({
        ...context,
        resourceName
    })
})



export const s3 = ExecuteStep.register('S3', async (context) => {
    await executor({
        context: { ...context, stackName: S3_STORAGE_STACK },
        name: `CloudFormation-Stack-init-${S3_STORAGE_STACK}`,
        method: createStack
    })

    await executor(context, s3Storages)
})

export const s3Storages = ExecuteStep.register('S3-Storages', async (context) => {
    const configs = collectMetadata(context, {
        metadataKey: CLASS_S3CONFIGURATIONKEY,
        selector: (c) => c.bucketName
    })

    for (const s3Config of configs) {
        await executor({
            context: { ...context, s3Config },
            name: `S3-Storage-${s3Config.bucketName}`,
            method: s3Storage
        })
    }
})

export const s3Storage = async (context) => {
    const { s3Config } = context

    s3Config.AWSBucketName = s3Config.bucketName

    if (!s3Config.exists) {
        s3Config.AWSBucketName = `${s3Config.bucketName}-${context.stage}`

        const s3Properties = {
            "BucketName": s3Config.AWSBucketName
        }

        const s3Bucket = {
            "Type": "AWS::S3::Bucket",
            "Properties": s3Properties
        }

        const resourceName = `S3${s3Config.bucketName}`
        const bucketResourceName = setResource(context, resourceName, s3Bucket, S3_STORAGE_STACK, true)
        s3Config.resourceName = bucketResourceName

        await executor({
            context: { ...context, s3BucketDefinition: s3Bucket },
            name: `S3-Storage-Subscription-${s3Config.bucketName}`,
            method: s3StorageSubscriptions
        })
    }

    for (const { serviceDefinition, serviceConfig } of s3Config.services) {
        if (!serviceConfig.injected) continue

        await executor({
            context: { ...context, serviceDefinition, serviceConfig },
            name: `S3-Storage-Policy-${s3Config.bucketName}-${serviceDefinition.service.name}`,
            method: s3StoragePolicy
        })
    }
}


export const s3StoragePolicy = async (context) => {
    const { s3Config, serviceDefinition, serviceConfig } = context

    let policy = serviceDefinition.roleResource.Properties.Policies.find(p => p.PolicyDocument.Statement[0].Action.includes('s3:PutObject'))
    if (!policy) {
        policy = {
            "PolicyName": {
                "Fn::Join": [
                    "-",
                    [
                        "functionly",
                        serviceDefinition.roleName,
                        "s3"
                    ]
                ]
            },
            "PolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:PutObjectAcl",
                        "s3:PutObjectTagging",
                        "s3:PutObjectVersionAcl",
                        "s3:PutObjectVersionTagging",
                        "s3:DeleteObject"
                    ],
                    "Resource": []
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": []
                }]
            }
        }
        serviceDefinition.roleResource.Properties.Policies = serviceDefinition.roleResource.Properties.Policies || []
        serviceDefinition.roleResource.Properties.Policies.push(policy)
    }

    const s3Arn = `arn:aws:s3:::${s3Config.AWSBucketName}/*`
    if (!policy.PolicyDocument.Statement[0].Resource.includes(s3Arn)) {
        policy.PolicyDocument.Statement[0].Resource.push(s3Arn)
        policy.PolicyDocument.Statement[1].Resource.push(`arn:aws:s3:::${s3Config.AWSBucketName}`)
    }
}

export const s3StorageSubscriptions = async (context) => {
    const { s3Config } = context

    if (s3Config.exists) return

    for (const { serviceDefinition, serviceConfig } of s3Config.services) {
        if (!serviceConfig.eventSource) continue

        await executor({
            context: { ...context, serviceDefinition, serviceConfig },
            name: `S3-Storage-Subscription-${s3Config.bucketName}-${serviceDefinition.service.name}`,
            method: s3BucketSubscription
        })

        await executor({
            context: { ...context, serviceDefinition, serviceConfig },
            name: `S3-Storage-Permission-${s3Config.bucketName}-${serviceDefinition.service.name}`,
            method: s3Permissions
        })
    }
}

export const s3BucketSubscription = async (context) => {
    const { serviceDefinition, serviceConfig, s3Config, s3BucketDefinition } = context

    if (s3Config.exists) return

    await setStackParameter({
        ...context,
        sourceStackName: getStackName(serviceDefinition),
        resourceName: serviceDefinition.resourceName,
        targetStackName: S3_STORAGE_STACK,
        attr: 'Arn'
    })

    s3BucketDefinition.Properties.NotificationConfiguration =
        s3BucketDefinition.Properties.NotificationConfiguration || {}
    s3BucketDefinition.Properties.NotificationConfiguration.LambdaConfigurations =
        s3BucketDefinition.Properties.NotificationConfiguration.LambdaConfigurations || []

    s3BucketDefinition.Properties.NotificationConfiguration.LambdaConfigurations.push({
        "Event": "s3:ObjectCreated:*",
        ...serviceConfig.eventSourceConfiguration,
        "Function": {
            // "Fn::Sub": "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:" + serviceDefinition.resourceName
            "Ref": `${serviceDefinition.resourceName}Arn`
        }
    })
}

export const s3Permissions = (context) => {
    const { serviceDefinition, serviceConfig, s3Config, s3BucketDefinition } = context

    if (s3Config.exists) return

    const properties = {
        "FunctionName": {
            "Ref": serviceDefinition.resourceName
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceArn": {
            "Fn::Join": [":", [
                "arn", "aws", "s3", "", "", `${serviceConfig.bucketName}-${context.stage}`]]
        }
    }

    const s3Permission = {
        "Type": "AWS::Lambda::Permission",
        "Properties": properties
    }
    const resourceName = `${s3Config.resourceName}Permission`
    const permissionResourceName = setResource(context, resourceName, s3Permission, getStackName(serviceDefinition), false, true)
}
