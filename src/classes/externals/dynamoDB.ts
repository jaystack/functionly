import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client'

import { InjectService } from '../injectService'
import { constants, getMetadata, classConfig } from '../../annotations'
import { DYNAMO_TABLE_NAME_SUFFIX } from '../../annotations/classes/dynamoTable'

const { CLASS_DYNAMOTABLECONFIGURATIONKEY } = constants

let dynamoDB = null;
const initAWSSDK = () => {
    if (!dynamoDB) {
        let awsConfig: any = {}
        if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
            awsConfig.apiVersion = '2012-08-10'
            awsConfig.region = process.env.AWS_REGION || 'eu-central-1'
            awsConfig.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000'

            console.log('Local DynamoDB configuration')
            console.log(JSON.stringify({
                apiVersion: awsConfig.apiVersion,
                'region (process.env.AWS_REGION)': awsConfig.region,
                'endpoint (process.env.SNS_LOCAL_ENDPOINT)': awsConfig.endpoint,
            }, null, 2))
        }

        dynamoDB = new AWS.DynamoDB(awsConfig);
    }
    return dynamoDB
}

@classConfig({
    injectServiceCopyMetadataKey: CLASS_DYNAMOTABLECONFIGURATIONKEY,
    injectServiceEventSourceKey: CLASS_DYNAMOTABLECONFIGURATIONKEY
})
export class DynamoDB extends InjectService {
    private _documentClient: DocumentClient
    public constructor() {
        initAWSSDK()

        super()
        this._documentClient = new AWS.DynamoDB.DocumentClient({ service: dynamoDB })
    }

    public getDocumentClient() {
        return this._documentClient
    }


    public async batchGet(params: DocumentClient.BatchGetItemInput) {
        return new Promise<DocumentClient.BatchGetItemOutput>((resolve, reject) => {
            this._documentClient.batchGet(params, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async batchWrite(params: DocumentClient.BatchWriteItemInput) {
        return new Promise<DocumentClient.BatchWriteItemOutput>((resolve, reject) => {
            this._documentClient.batchWrite(params, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async createSet(list: number[] | string[] | DocumentClient.binaryType[], options?: DocumentClient.CreateSetOptions) {
        return this._documentClient.createSet(list, options)
    }
    public async delete(params: Partial<DocumentClient.DeleteItemInput>) {
        return new Promise<DocumentClient.DeleteItemOutput>((resolve, reject) => {
            this._documentClient.delete(this.setDefaultValues(params, 'delete'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async get(params: Partial<DocumentClient.GetItemInput>) {
        return new Promise<DocumentClient.GetItemOutput>((resolve, reject) => {
            this._documentClient.get(this.setDefaultValues(params, 'get'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async put(params: Partial<DocumentClient.PutItemInput>) {
        return new Promise<DocumentClient.PutItemOutput>((resolve, reject) => {
            this._documentClient.put(this.setDefaultValues(params, 'put'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async query(params?: Partial<DocumentClient.QueryInput>) {
        return new Promise<DocumentClient.QueryOutput>((resolve, reject) => {
            this._documentClient.query(this.setDefaultValues(params, 'query'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async scan(params?: Partial<DocumentClient.ScanInput>) {
        return new Promise<DocumentClient.ScanOutput>((resolve, reject) => {
            this._documentClient.scan(this.setDefaultValues(params, 'scan'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async update(params: Partial<DocumentClient.UpdateItemInput>) {
        return new Promise<DocumentClient.UpdateItemOutput>((resolve, reject) => {
            this._documentClient.update(this.setDefaultValues(params, 'update'), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    protected setDefaultValues(params, command) {
        const tableConfig = (getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, this) || [])[0]
        const tableName = ({ TableName: tableConfig && tableConfig.tableName, ...tableConfig.nativeConfig }).TableName

        const calcTableName = process.env[`${this.constructor.name}${DYNAMO_TABLE_NAME_SUFFIX}`] + `-${process.env.FUNCTIONAL_STAGE}`
        const initParams = {
            TableName: calcTableName || tableName
        }

        return { ...initParams, ...params }
    }
}