import { S3 } from 'aws-sdk'
import { Api } from '../../api'
import { constants, getMetadata, classConfig, inject, injectable, InjectionScope } from '../../../annotations'
import { S3_BUCKET_SUFFIX } from '../../../annotations/classes/s3Storage'
const { CLASS_S3CONFIGURATIONKEY } = constants

export { S3 } from 'aws-sdk'

@injectable(InjectionScope.Singleton)
export class S3Api extends Api {
    private s3 = null
    public constructor() {
        super();
    }

    public async init() {
        let awsConfig: any = {}
        if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
            awsConfig.apiVersion = '2006-03-01'
            awsConfig.region = process.env.AWS_REGION || 'us-east-1'
            awsConfig.endpoint = 'S3_LOCAL_ENDPOINT' in process.env ? process.env.S3_LOCAL_ENDPOINT : 'http://localhost:4572'

            console.log('Local S3 configuration')
            console.log(JSON.stringify({
                apiVersion: awsConfig.apiVersion,
                'region (process.env.AWS_REGION)': awsConfig.region,
                'endpoint (process.env.S3_LOCAL_ENDPOINT)': awsConfig.endpoint,
            }, null, 2))
        }

        this.s3 = new S3(awsConfig);
    }

    public getS3() {
        return this.s3
    }
}

@classConfig({
    injectServiceCopyMetadataKey: CLASS_S3CONFIGURATIONKEY,
    injectServiceEventSourceKey: CLASS_S3CONFIGURATIONKEY
})
export class S3Storage extends Api {
    private _s3Client: S3
    public constructor( @inject(S3Api) private s3Api: S3Api) {
        super()
    }
    public async init() {
        this._s3Client = this.s3Api.getS3()
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

    public async getObject(params: Partial<S3.GetObjectRequest>) {
        return new Promise<S3.GetObjectOutput>((resolve, reject) => {
            if (typeof params.Key === 'string') {
                params = {
                    ...params,
                    Key: /^\//.test(params.Key) ? params.Key.substring(1, params.Key.length) : params.Key
                }
            }
            this._s3Client.getObject(this.setDefaultValues(params, 'getObject'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    public async deleteObject(params: Partial<S3.DeleteObjectRequest>) {
        return new Promise<S3.DeleteObjectOutput>((resolve, reject) => {
            if (typeof params.Key === 'string') {
                params = {
                    ...params,
                    Key: /^\//.test(params.Key) ? params.Key.substring(1, params.Key.length) : params.Key
                }
            }
            this._s3Client.deleteObject(this.setDefaultValues(params, 'deleteObject'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    public async listObjectsV2(params: Partial<S3.ListObjectsV2Request>) {
        return new Promise<S3.ListObjectsV2Output>((resolve, reject) => {
            this._s3Client.listObjectsV2(this.setDefaultValues(params, 'listObjectsV2'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    public async getSignedUrl(operation: string, params: any) {
        return new Promise<string>((resolve, reject) => {
            if (typeof params.Key === 'string') {
                params = {
                    ...params,
                    Key: /^\//.test(params.Key) ? params.Key.substring(1, params.Key.length) : params.Key
                }
            }
            this._s3Client.getSignedUrl(operation, this.setDefaultValues(params, 'getSignedUrl'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    public upload(
        params: Partial<S3.PutObjectRequest>,
        options?: S3.ManagedUpload.ManagedUploadOptions,
        callback?: (err: Error, data: S3.ManagedUpload.SendData) => void): S3.ManagedUpload {
        return this._s3Client.upload(this.setDefaultValues(params, 'upload'), options, callback)
    }

    protected setDefaultValues(params, command) {
        const bucketConfig = (getMetadata(CLASS_S3CONFIGURATIONKEY, this) || [])[0] || {}
        const bucketName = bucketConfig.bucketName

        const calcBucketName = bucketConfig.environmentKey && process.env[bucketConfig.environmentKey] ? process.env[bucketConfig.environmentKey] : ''
        const suffix = bucketConfig.exists ? '' : `-${process.env.FUNCTIONAL_STAGE}`
        const initParams = {
            Bucket: (calcBucketName || bucketName) + suffix
        }

        return { ...initParams, ...params }
    }
}