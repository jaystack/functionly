import { S3 } from 'aws-sdk'
import { Api } from '../api'
import { constants, getMetadata, classConfig } from '../../annotations'
import { S3_BUCKET_SUFFIX } from '../../annotations/classes/s3Storage'
const { CLASS_S3CONFIGURATIONKEY } = constants

export { S3 } from 'aws-sdk'

let s3 = null;
const initAWSSDK = () => {
    if (!s3) {
        let awsConfig: any = {}
        if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
            awsConfig.apiVersion = '2006-03-01'
            awsConfig.region = process.env.AWS_REGION || 'eu-central-1'
            awsConfig.endpoint = process.env.S3_LOCAL_ENDPOINT || 'http://localhost:4572'

            console.log('Local S3 configuration')
            console.log(JSON.stringify({
                apiVersion: awsConfig.apiVersion,
                'region (process.env.AWS_REGION)': awsConfig.region,
                'endpoint (process.env.S3_LOCAL_ENDPOINT)': awsConfig.endpoint,
            }, null, 2))
        }

        s3 = new S3(awsConfig);
    }
    return s3
}

@classConfig({
    injectServiceCopyMetadataKey: CLASS_S3CONFIGURATIONKEY,
    injectServiceEventSourceKey: CLASS_S3CONFIGURATIONKEY
})
export class S3Storage extends Api {
    private _s3Client: S3
    public constructor() {
        initAWSSDK()

        super()
        this._s3Client = s3
    }
    public getS3() {
        return this._s3Client
    }


    public async putObject(params: Partial<S3.PutObjectRequest>) {
        return new Promise<S3.PutObjectOutput>((resolve, reject) => {
            if (typeof params.Key === 'string') {
                params = {
                    ...params,
                    Key: /^\//.test(params.Key) ? params.Key.substring(1, params.Key.length) : params.Key
                }
            }
            this._s3Client.putObject(this.setDefaultValues(params, 'putObject'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    protected setDefaultValues(params, command) {
        const initParams = {
            Bucket: process.env[`${this.constructor.name}${S3_BUCKET_SUFFIX}`] + `-${process.env.FUNCTIONAL_STAGE}`
        }

        return { ...initParams, ...params }
    }
}