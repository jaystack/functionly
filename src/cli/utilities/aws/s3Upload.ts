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


export const upload = (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {

        const date = new Date()
        let params = merge({}, config.S3, {
            Bucket: context.awsBucket,
            Body: new Buffer(context.zipData(), 'binary'),
            Key: `services-${date.toISOString()}.zip`,
            ContentType: 'application/zip'
        })

        s3.putObject(params, (err, res) => {
            if(err) return reject(err)

            context.S3Zip = params.Key

            return resolve()
        })
    })
}