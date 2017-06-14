import { S3 } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'
import { ExecuteStep, executor } from '../../context'

import { writeFileSync } from 'fs'
import { join, normalize } from 'path'

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

export const uploadZipStep = (name, data, localName?) => {
    return async (context) => {
        const step = uploaderStep(name, data, 'application/zip', localName)
        const uploadResult = await executor(context, step)
        context.S3Zip = uploadResult.Key
        return uploadResult
    }
}

export const uploaderStep = (name, data, contentType, localName?) => {
    return async (context) => {
        context.upload = {
            name,
            data,
            contentType,
            localName
        }
        const uploadResult = await executor(context, uploadToAws)
        delete context.upload
        return uploadResult
    }
}

export const uploadToAws = ExecuteStep.register('S3-Upload', async (context) => {
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {
        const version = context.version ? `${context.version}/` : ''
        const binary = new Buffer(context.upload.data, 'binary')
        let params = merge({}, config.S3, {
            Bucket: context.awsBucket,
            Body: binary,
            Key: `functionly/${version}${context.upload.name}`,
            ContentType: context.upload.contentType
        })

        s3.putObject(params, (err, res) => {
            if (err) return reject(err)

            if (config.tempDirectory && context.upload.localName) {
                writeFileSync(join(config.tempDirectory, context.upload.localName), binary)
            }

            return resolve(params)
        })
    })
})