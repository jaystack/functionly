import { SNS } from 'aws-sdk'
export { SNS } from 'aws-sdk'
// import { } from 'aws-sdk/clients/sns'

import { Service } from '../service'
import { constants, getMetadata } from '../../annotations'
const { CLASS_SNSCONFIGURATIONKEY } = constants

let sns = null;
const initAWSSDK = () => {
    if (!sns) {
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

        sns = new SNS(awsConfig);
    }
    return sns
}

export class SimpleNotificationService extends Service {
    private _snsClient: SNS
    constructor() {
        initAWSSDK()

        super()
        this._snsClient = sns
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
        const snsConfig = (getMetadata(CLASS_SNSCONFIGURATIONKEY, this) || [])[0]
        const topicName = snsConfig && snsConfig.topicName
        const initParams = {
            TopicArn: 'arn:aws:sns:null:null:' + process.env[`${this.constructor.name}_SNS_TOPICNAME`] || topicName
        }

        return { ...initParams, ...params }
    }
}