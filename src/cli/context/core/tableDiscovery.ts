import { merge } from 'lodash'
import { getMetadata, constants, __dynamoDBDefaults } from '../../../annotations'

export const tableNameEnvRegexp = /_TABLE_NAME$/
export const tableDiscovery = async (context) => {
    let tablesToCreate = new Map()

    for (let serviceDefinition of context.publishedFunctions) {
        let tableConfigs = getMetadata(constants.CLASS_DYNAMOTABLECONFIGURATIONKEY, serviceDefinition.service) || []
        for (const tableConfig of tableConfigs) {
            if (tablesToCreate.has(tableConfig.tableName)) {
                continue
            }

            tablesToCreate.set(tableConfig.tableName, tableConfig)
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

    context.tableConfigs = Array.from(tablesToCreate.values())
}