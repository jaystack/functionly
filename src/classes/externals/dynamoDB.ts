import * as AWS from 'aws-sdk'
import { merge, defaults } from 'lodash'
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client'

import { Service } from '../service'

let dynamoDB = null;
const initAWSSDK = () => {
    if (!dynamoDB) {
        let awsConfig: any = {}
        if (process.env.FUNCTIONAL_ENVIRONMENT === 'local') {
            awsConfig.apiVersion = '2012-08-10'
            awsConfig.region = process.env.AWS_REGION || 'eu-central-1'
            awsConfig.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000'
        }

        dynamoDB = new AWS.DynamoDB(awsConfig);
    }
    return dynamoDB
}

export class DynamoDB extends Service {
    private _documentClient: DocumentClient
    constructor() {
        initAWSSDK()
        
        super()
        this._documentClient = new AWS.DynamoDB.DocumentClient({ service: dynamoDB })
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
            this._documentClient.delete(this.setDefaultValues(params), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async get(params: Partial<DocumentClient.GetItemInput>) {
        return new Promise<DocumentClient.GetItemOutput>((resolve, reject) => {
            this._documentClient.get(this.setDefaultValues(params), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async put(params: Partial<DocumentClient.PutItemInput>) {
        return new Promise<DocumentClient.PutItemOutput>((resolve, reject) => {
            this._documentClient.put(this.setDefaultValues(params), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async query(params?: Partial<DocumentClient.QueryInput>) {
        return new Promise<DocumentClient.QueryOutput>((resolve, reject) => {
            this._documentClient.query(this.setDefaultValues(params), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async scan(params?: Partial<DocumentClient.ScanInput>) {
        return new Promise<DocumentClient.ScanOutput>((resolve, reject) => {
            this._documentClient.scan(this.setDefaultValues(params), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }
    public async update(params: Partial<DocumentClient.UpdateItemInput>) {
        return new Promise<DocumentClient.UpdateItemOutput>((resolve, reject) => {
            this._documentClient.update(this.setDefaultValues(params), (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    private setDefaultValues(params) {
        let initParams = {
            TableName: process.env[`${this.constructor.name}_TABLE_NAME`]
        }
        return defaults({}, params, initParams)
    }
}