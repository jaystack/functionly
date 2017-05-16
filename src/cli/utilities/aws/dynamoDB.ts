import { DynamoDB } from 'aws-sdk'
import { merge } from 'lodash'
import { config } from '../config'
import { getMetadata, constants } from '../../../annotations'

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
        let metadata = getMetadata(constants.Class_EnvironmentKey, serviceDefinition.service)
        if (metadata) {
            let keys = Object.keys(metadata)
            for (var key of keys) {
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
        } catch (e) { }
    }
}

export const createTable = (tableConfig, context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {

        let params = merge({}, tableConfig, {
            AttributeDefinitions: [
                {
                    AttributeName: "Id",
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "Id",
                    KeyType: "HASH"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 2,
                WriteCapacityUnits: 2
            }
        });

        dynamoDB.createTable(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });

    })
}
