import { getMetadata, constants, __dynamoDBDefaults } from '../../../annotations'
import { DYNAMO_TABLE_NAME_SUFFIX } from '../../../annotations/classes/dynamoTable'
import { ExecuteStep } from '../core/executeStep'

export class TableDiscoveryStep extends ExecuteStep {
    protected tableNameEnvRegexp = new RegExp(`${DYNAMO_TABLE_NAME_SUFFIX}$`)
    public async method(context) {
        const tablesToCreate = new Map()

        for (let serviceDefinition of context.publishedFunctions) {
            let tableConfigs = getMetadata(constants.CLASS_DYNAMOTABLECONFIGURATIONKEY, serviceDefinition.service) || []
            for (const tableConfig of tableConfigs) {
                if (tablesToCreate.has(tableConfig.tableName)) {
                    const def = tablesToCreate.get(tableConfig.tableName)
                    def.usedBy.push(serviceDefinition.service)
                    continue
                }

                tablesToCreate.set(tableConfig.tableName, { ...tableConfig, usedBy: [serviceDefinition.service] })
            }

            let metadata = getMetadata(constants.CLASS_ENVIRONMENTKEY, serviceDefinition.service)
            if (metadata) {
                let keys = Object.keys(metadata)
                for (const key of keys) {
                    if (this.tableNameEnvRegexp.test(key)) {
                        if (tablesToCreate.has(metadata[key])) {
                            const def = tablesToCreate.get(metadata[key])
                            def.usedBy.push(serviceDefinition.service)
                            continue
                        }

                        tablesToCreate.set(metadata[key], { TableName: metadata[key], usedBy: [serviceDefinition.service] })
                    }
                }
            }
        }

        context.tableConfigs = Array.from(tablesToCreate.values())
    }
}


export const tableDiscovery = new TableDiscoveryStep('TableDiscovery')
