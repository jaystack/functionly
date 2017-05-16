import { Lambda } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../utilities/config'
import { bundle } from '../utilities/webpack'
import { zip } from '../utilities/compress'
import { upload } from '../utilities/aws/s3Upload'

import { getMetadata, constants } from '../../annotations'

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


export const createLambda = async (context) => {
    initAWSSDK(context)

    await bundle(context)
    await zip(context)
    await upload(context)

    for (let serviceDefinition of context.publishedFunctions) {
        const serviceName = serviceDefinition.service.name
        if (serviceName) {
            try {
                await getLambdaFunction(serviceDefinition, context)
                console.log('get success', serviceName)
                await deleteLambdaFunction(serviceDefinition, context)
                console.log('delete success', serviceName)
            } catch (e) {
                console.log('not exists -> new', serviceName)
            }

            // await publishLambdaFunction(serviceDefinition, context)
            await createLambdaFunction(serviceDefinition, context)
            console.log('create success', serviceName)

        }
    }
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
            FunctionName: serviceDefinition.service.name,
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
    return new Promise((resolve, reject) => {
        let params = {
            FunctionName: serviceDefinition.service.name
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
            FunctionName: serviceDefinition.service.name
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
            FunctionName: serviceDefinition.service.name
        };
        lambda.publishVersion(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}