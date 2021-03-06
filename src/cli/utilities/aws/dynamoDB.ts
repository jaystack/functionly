import { DynamoDB } from 'aws-sdk'
import { config } from '../config'
import { __dynamoDBDefaults } from '../../../annotations'
import { ExecuteStep, executor } from '../../context'

let dynamoDB = null;
const initAWSSDK = (context) => {
    if (!dynamoDB) {
        let awsConfig = { ...config.aws.DynamoDB }
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


export const createTables = ExecuteStep.register('CreateTables', async (context) => {
    initAWSSDK(context)

    for (let tableConfig of context.tableConfigs) {
        try {
            let data = await executor({
                context: { ...context, tableConfig },
                name: `CreateTable-${tableConfig.tableName}`,
                method: createTable
            })
            console.log(`${data.TableDescription.TableName} DynamoDB table created.`)
        } catch (e) {
            if (e.code !== 'ResourceInUseException') {
                throw e
            }
        }
    }
})

export const createTable = (context) => {
    initAWSSDK(context)
    const { tableConfig } = context
    return new Promise<any>((resolve, reject) => {

        let params = {
            ...__dynamoDBDefaults,
            TableName: tableConfig.tableName + `-${process.env.FUNCTIONAL_STAGE}`,
            ...tableConfig.nativeConfig
        };

        dynamoDB.createTable(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });

    })
}
