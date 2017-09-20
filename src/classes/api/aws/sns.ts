import { SNS } from 'aws-sdk'
export { SNS } from 'aws-sdk'

import { Api } from '../../api'
import { constants, getMetadata, classConfig, inject, injectable, InjectionScope } from '../../../annotations'
const { CLASS_SNSCONFIGURATIONKEY } = constants

@injectable(InjectionScope.Singleton)
export class SNSApi extends Api {
    private sns = null
    public constructor() {
        super();

        let awsConfig: any = {}
        if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
            awsConfig.apiVersion = '2010-03-31'
            awsConfig.region = process.env.AWS_REGION || 'eu-central-1'
            awsConfig.endpoint = process.env.SNS_LOCAL_ENDPOINT || 'http://localhost:4100'

            console.log('Local SNS configuration')
            console.log(JSON.stringify({
                apiVersion: awsConfig.apiVersion,
                'region (process.env.AWS_REGION)': awsConfig.region,
                'endpoint (process.env.SNS_LOCAL_ENDPOINT)': awsConfig.endpoint,
            }, null, 2))
        }

        this.sns = new SNS(awsConfig);
    }

    public getSNS() {
        return this.sns
    }
}

@classConfig({
    injectServiceCopyMetadataKey: CLASS_SNSCONFIGURATIONKEY,
    injectServiceEventSourceKey: CLASS_SNSCONFIGURATIONKEY
})
export class SimpleNotificationService extends Api {
    private _snsClient: SNS
    public constructor(@inject(SNSApi) private snsApi: SNSApi) {
        super()
    }
    public async init(){
        this._snsClient = this.snsApi.getSNS()
    }

    public getSNS() {
        return this._snsClient
    }

    public async publish(params: SNS.PublishInput) {
        return new Promise<SNS.PublishResponse>((resolve, reject) => {
            this._snsClient.publish(this.setDefaultValues(params, 'publish'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    protected setDefaultValues(params, command) {
        const initParams = {
            TopicArn: process.env[`${this.constructor.name}_SNS_TOPICNAME_ARN`]
        }

        return { ...initParams, ...params }
    }
}