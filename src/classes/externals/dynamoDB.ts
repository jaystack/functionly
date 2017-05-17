import * as AWS from 'aws-sdk'
import { merge, defaults } from 'lodash'

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

export class DynamoDBNative extends Service {
    public static factory(): any {
        initAWSSDK()

        return dynamoDB;
    }
}

export class DynamoDBDocumentClient extends Service {
    public static factory(): any {
        initAWSSDK()

        return new AWS.DynamoDB.DocumentClient({ service: dynamoDB });
    }
}

const promiseWrap = (func) => {
    return new Promise((resolve, reject) => {
        func((err, result) => {
            if (err) reject(err)
            else resolve(result)
        })
    })
}

export class DynamoDB extends Service {
    public async put<T>(param: { Item: T }) {

    }
    public async scan(param?: any) {
        
    }
    public static factory(TableName) {
        initAWSSDK()

        let db = new AWS.DynamoDB.DocumentClient({ service: dynamoDB })
        let initParams = {
            TableName: TableName || process.env[`${this.name}_TABLE_NAME`]
        }

        const handler = (fnName) => async (params) => promiseWrap((done) => db[fnName](defaults({}, params, initParams), done))

        return {
            batchGet: async (params) => promiseWrap((done) => db.batchGet(params, done)),
            batchWrite: async (params) => promiseWrap((done) => db.batchWrite(params, done)),
            createSet: (param, opt): any => db.createSet(param, opt),
            delete: handler('delete'),
            get: handler('get'),
            put: handler('put'),
            query: handler('query'),
            scan: handler('scan'),
            update: handler('update'),
        }
    }
}