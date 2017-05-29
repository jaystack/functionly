import { S3 } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'

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

export const uploadZip = async (context, name, data) => {
    const uploadResult = await upload(context, name, data, 'application/zip')
    context.S3Zip = uploadResult.Key
    return uploadResult
}


export const upload = (context, name, data, contentType) => {
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {
        let params = merge({}, config.S3, {
            Bucket: context.awsBucket,
            Body: new Buffer(data, 'binary'),
            Key: name,
            ContentType: contentType
        })

        s3.putObject(params, (err, res) => {
            if (err) return reject(err)
            return resolve(params)
        })
    })
}