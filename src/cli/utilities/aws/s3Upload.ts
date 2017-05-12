import { S3 } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'

let s3 = new S3(config.aws.S3);

export const upload = (context) => {
    return new Promise((resolve, reject) => {

        const date = new Date()
        let params = merge({}, config.S3, {
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