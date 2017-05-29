import { DynamoDB } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'
import { __dynamoDBDefaults } from '../../../annotations'

let dynamoDB = null;
const initAWSSDK = (context) => {
    if (!dynamoDB) {
        let awsConfig = merge({}, config.aws.DynamoDB)
        if (context.awsRegion) {
            awsConfig.region = context.awsRegion
        }

        if (context.deployTarget === 'local') {
            awsConfig.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000'
        }

        dynamoDB = new DynamoDB(awsConfig);
    }
    return dynamoDB
}


export const createTables = async (context) => {
    initAWSSDK(context)

    for (let tableConfig of context.tableConfigs) {
        try {
            let data = await createTable(tableConfig, context)
            console.log(`${data.TableDescription.TableName} DynamoDB table created.`)
        } catch (e) {
            if (e.code !== 'ResourceInUseException') {
                throw e
            }
        }
    }
}

export const createTable = (tableConfig, context) => {
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {

        let params = merge({}, {
            TableName: tableConfig.tableName
        }, tableConfig.nativeConfig, __dynamoDBDefaults);

        dynamoDB.createTable(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });

    })
}
