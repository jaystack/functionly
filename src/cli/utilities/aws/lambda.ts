import { Lambda } from 'aws-sdk'
import { merge, difference } from 'lodash'
import { config } from '../../utilities/config'
import { getMetadata, constants, getFunctionName } from '../../../annotations'


let lambda = null;
const initAWSSDK = (context) => {
    if (!lambda) {
        let awsConfig = merge({}, config.aws.Lambda)
        if (context.awsRegion) {
            awsConfig.region = context.awsRegion
        }

        lambda = new Lambda(awsConfig);
    }
    return lambda
}



export const createLambdaFunction = (serviceDefinition, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            Code: {
                S3Bucket: context.awsBucket,
                S3Key: context.S3Zip
            },
            Description: getMetadata(constants.Class_DescriptionKey, serviceDefinition.service),
            FunctionName: getFunctionName(serviceDefinition.service),
            Handler: serviceDefinition.handler,
            MemorySize: getMetadata(constants.Class_MemorySizeKey, serviceDefinition.service),
            Publish: true,
            Role: getMetadata(constants.Class_RoleKey, serviceDefinition.service),
            Runtime: getMetadata(constants.Class_RuntimeKey, serviceDefinition.service) || "nodejs6.10",
            Timeout: getMetadata(constants.Class_TimeoutKey, serviceDefinition.service),
            Environment: {
                Variables: getMetadata(constants.Class_EnvironmentKey, serviceDefinition.service)
            },
            Tags: getMetadata(constants.Class_TagKey, serviceDefinition.service),
            VpcConfig: {
            }
        };

        lambda.createFunction(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const getLambdaFunction = (serviceDefinition, context) => {
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(serviceDefinition.service)
        };
        lambda.getFunction(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const deleteLambdaFunction = (serviceDefinition, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(serviceDefinition.service)
        };
        lambda.deleteFunction(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const publishLambdaFunction = (serviceDefinition, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(serviceDefinition.service)
        };
        lambda.publishVersion(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const updateLambdaFunctionCode = (serviceDefinition, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(serviceDefinition.service),
            S3Bucket: context.awsBucket,
            S3Key: context.S3Zip,
            Publish: true
        };
        lambda.updateFunctionCode(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const updateLambdaFunctionConfiguration = (serviceDefinition, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(serviceDefinition.service),
            Description: getMetadata(constants.Class_DescriptionKey, serviceDefinition.service),
            Environment: {
                Variables: getMetadata(constants.Class_EnvironmentKey, serviceDefinition.service)
            },
            Handler: serviceDefinition.handler,
            MemorySize: getMetadata(constants.Class_MemorySizeKey, serviceDefinition.service),
            Role: getMetadata(constants.Class_RoleKey, serviceDefinition.service),
            Runtime: getMetadata(constants.Class_RuntimeKey, serviceDefinition.service) || "nodejs6.10",
            Timeout: getMetadata(constants.Class_TimeoutKey, serviceDefinition.service),
            VpcConfig: {
            }
        };
        lambda.updateFunctionConfiguration(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const updateLambdaFunctionTags = async (serviceDefinition, context) => {
    initAWSSDK(context)
    const getLambdaFunctionResult = await getLambdaFunction(serviceDefinition, context)
    const Tags = getMetadata(constants.Class_TagKey, serviceDefinition.service) || {}

    const listTagParams = {
        Resource: getLambdaFunctionResult.Configuration.FunctionArn
    };

    const listTagResult = await listTags(listTagParams, context)
    const tagToRemove = difference(Object.keys(listTagResult.Tags), Object.keys(Tags))
    if (tagToRemove.length > 0) {
        let untagResourceParams = {
            Resource: getLambdaFunctionResult.Configuration.FunctionArn,
            TagKeys: tagToRemove
        }
        await untagResource(untagResourceParams, context)
    }

    if (Object.keys(Tags).length) {
        let tagResourceParams = {
            Resource: getLambdaFunctionResult.Configuration.FunctionArn,
            Tags
        };

        await tagResource(tagResourceParams, context)
    }
}

export const listTags = (params, context) => {
    initAWSSDK(context)
    return new Promise<any>(async (resolve, reject) => {
        lambda.listTags(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const untagResource = (params, context) => {
    initAWSSDK(context)
    return new Promise(async (resolve, reject) => {
        lambda.untagResource(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const tagResource = (params, context) => {
    initAWSSDK(context)
    return new Promise(async (resolve, reject) => {
        lambda.tagResource(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

