import { Lambda } from 'aws-sdk'
import { merge, difference } from 'lodash'
import { config } from '../../utilities/config'
import { getMetadata, constants, getFunctionName } from '../../../annotations'
import { ContextStep } from '../../context'


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



export const createLambdaFunction = ContextStep.register('createLambdaFunction', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            Code: {
                S3Bucket: context.awsBucket,
                S3Key: context.S3Zip
            },
            Description: getMetadata(constants.CLASS_DESCRIPTIONKEY, context.serviceDefinition.service),
            FunctionName: getFunctionName(context.serviceDefinition.service),
            Handler: context.serviceDefinition.handler,
            MemorySize: getMetadata(constants.CLASS_MEMORYSIZEKEY, context.serviceDefinition.service),
            Publish: true,
            Role: getMetadata(constants.CLASS_ROLEKEY, context.serviceDefinition.service),
            Runtime: getMetadata(constants.CLASS_RUNTIMEKEY, context.serviceDefinition.service) || "nodejs6.10",
            Timeout: getMetadata(constants.CLASS_TIMEOUTKEY, context.serviceDefinition.service),
            Environment: {
                Variables: getMetadata(constants.CLASS_ENVIRONMENTKEY, context.serviceDefinition.service)
            },
            Tags: getMetadata(constants.CLASS_TAGKEY, context.serviceDefinition.service),
            VpcConfig: {
            }
        };

        lambda.createFunction(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
})

export const getLambdaFunction = ContextStep.register('getLambdaFunction', (context) => {
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(context.serviceDefinition.service)
        };
        lambda.getFunction(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
})

export const deleteLambdaFunction = ContextStep.register('deleteLambdaFunction', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(context.serviceDefinition.service)
        };
        lambda.deleteFunction(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
})

export const publishLambdaFunction = ContextStep.register('publishLambdaFunction', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(context.serviceDefinition.service)
        };
        lambda.publishVersion(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
})

export const updateLambdaFunctionCode = ContextStep.register('updateLambdaFunctionCode', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(context.serviceDefinition.service),
            S3Bucket: context.awsBucket,
            S3Key: context.S3Zip,
            Publish: true
        };
        lambda.updateFunctionCode(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
})

export const updateLambdaFunctionConfiguration = ContextStep.register('updateLambdaFunctionConfiguration', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: getFunctionName(context.serviceDefinition.service),
            Description: getMetadata(constants.CLASS_DESCRIPTIONKEY, context.serviceDefinition.service),
            Environment: {
                Variables: getMetadata(constants.CLASS_ENVIRONMENTKEY, context.serviceDefinition.service)
            },
            Handler: context.serviceDefinition.handler,
            MemorySize: getMetadata(constants.CLASS_MEMORYSIZEKEY, context.serviceDefinition.service),
            Role: getMetadata(constants.CLASS_ROLEKEY, context.serviceDefinition.service),
            Runtime: getMetadata(constants.CLASS_RUNTIMEKEY, context.serviceDefinition.service) || "nodejs6.10",
            Timeout: getMetadata(constants.CLASS_TIMEOUTKEY, context.serviceDefinition.service),
            VpcConfig: {
            }
        };
        lambda.updateFunctionConfiguration(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
})

export const updateLambdaFunctionTags = ContextStep.register('updateLambdaFunctionTags', async (context) => {
    initAWSSDK(context)
    const getLambdaFunctionResult = await context.runStep(getLambdaFunction)
    const Tags = getMetadata(constants.CLASS_TAGKEY, context.serviceDefinition.service) || {}

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
})

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

