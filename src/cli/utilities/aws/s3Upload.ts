import { S3 } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'
import { ContextStep } from '../../context'

let s3 = null;
const initAWSSDK = (context) => {
    if (!s3) {
        let awsConfig = merge({}, config.aws.S3)
        if (context.awsRegion) {
            awsConfig.region = context.awsRegion
        }

        s3 = new S3(awsConfig);
    }
    return s3
}

export const uploadZipStep = (name, data) => {
    return async (context) => {
        const step = uploaderStep(name, data, 'application/zip')
        const uploadResult = await context.runStep(step)
        context.S3Zip = uploadResult.Key
        return uploadResult
    }
}

export const uploaderStep = (name, data, contentType) => {
    return async (context) => {
        context.upload = {
            name,
            data,
            contentType
        }
        const uploadResult = await context.runStep(uploadToAws)
        delete context.upload
        return uploadResult
    }
}

export const uploadToAws = ContextStep.register('uploadToAws', async (context) => {
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {
        let params = merge({}, config.S3, {
            Bucket: context.awsBucket,
            Body: new Buffer(context.upload.data, 'binary'),
            Key: context.upload.name,
            ContentType: context.upload.contentType
        })

        s3.putObject(params, (err, res) => {
            if (err) return reject(err)
            return resolve(params)
        })
    })
})