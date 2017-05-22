import { DynamoDB } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'
import { getMetadata, constants, __dynamoDBDefaults } from '../../../annotations'

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


export const tableNameEnvRegexp = /_TABLE_NAME$/
export const collectAndCreateTables = async (context) => {
    initAWSSDK(context)

    let tablesToCreate = new Map()

    for (let serviceDefinition of context.publishedFunctions) {
        let tableConfigs = getMetadata(constants.CLASS_DYNAMOTABLECONFIGURATIONKEY, serviceDefinition.service) || []
        for (const tableConfig of tableConfigs) {
            if (tablesToCreate.has(tableConfig.tableName)) {
                continue
            }

            tablesToCreate.set(tableConfig.tableName, merge({}, {
                TableName: tableConfig.tableName
            }, tableConfig.nativeConfig))
        }

        let metadata = getMetadata(constants.CLASS_ENVIRONMENTKEY, serviceDefinition.service)
        if (metadata) {
            let keys = Object.keys(metadata)
            for (const key of keys) {
                if (tableNameEnvRegexp.test(key) && !tablesToCreate.has(metadata[key])) {
                    tablesToCreate.set(metadata[key], {
                        TableName: metadata[key]
                    })
                }
            }
        }
    }

    for (let tableConfig of tablesToCreate.values()) {
        try {
            await createTable(tableConfig, context)
            console.log(`${tableConfig.TableName} DynamoDB table created.`)
        } catch (e) {
            if (e.code !== 'ResourceInUseException') {
                throw e
            }
        }
    }
}

export const createTable = (tableConfig, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {

        let params = merge({}, tableConfig, __dynamoDBDefaults);

        dynamoDB.createTable(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });

    })
}
