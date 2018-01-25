import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client'

import { Api } from '../../api'
import { constants, getMetadata, classConfig, inject, injectable, InjectionScope } from '../../../annotations'

const { CLASS_DYNAMOTABLECONFIGURATIONKEY } = constants

@injectable(InjectionScope.Singleton)
export class DocumentClientApi extends Api {
    private dynamoDB = null
    public constructor() {
        super();
    }

    public async init() {
        let awsConfig: any = {}
        if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
            awsConfig.apiVersion = '2012-08-10'
            awsConfig.region = process.env.AWS_REGION || 'us-east-1'
            if (process.env.DYNAMODB_LOCAL !== 'false') {
                awsConfig.endpoint = 'DYNAMODB_LOCAL_ENDPOINT' in process.env ? process.env.DYNAMODB_LOCAL_ENDPOINT : 'http://localhost:8000'
            }

            console.log('Local DynamoDB configuration')
            console.log(JSON.stringify({
                apiVersion: awsConfig.apiVersion,
                'region (process.env.AWS_REGION)': awsConfig.region,
                'endpoint (process.env.DYNAMODB_LOCAL_ENDPOINT)': awsConfig.endpoint,
            }, null, 2))
        }

        this.dynamoDB = new AWS.DynamoDB(awsConfig);
    }

    public getDocumentClient() {
        return new AWS.DynamoDB.DocumentClient({ service: this.dynamoDB })
    }
}

@classConfig({
    injectServiceCopyMetadataKey: CLASS_DYNAMOTABLECONFIGURATIONKEY,
    injectServiceEventSourceKey: CLASS_DYNAMOTABLECONFIGURATIONKEY
})
export class DynamoTable extends Api {
    private _documentClient: DocumentClient
    public constructor( @inject(DocumentClientApi) private documentClientApi: DocumentClientApi) {
        super()
    }
    public async init() {
        this._documentClient = this.documentClientApi.getDocumentClient()
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
        const tableConfig = (getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, this) || [])[0] || {}
        const tableName = ({ TableName: tableConfig.tableName, ...tableConfig.nativeConfig }).TableName

        const calcTableName = tableConfig.environmentKey && process.env[tableConfig.environmentKey] ? process.env[tableConfig.environmentKey] : ''
        const suffix = tableConfig.exists ? '' : `-${process.env.FUNCTIONAL_STAGE}`
        const initParams = {
            TableName: (calcTableName || tableName) + suffix
        }

        return { ...initParams, ...params }
    }
}