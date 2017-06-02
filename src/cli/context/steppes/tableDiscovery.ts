import { getMetadata, constants, __dynamoDBDefaults } from '../../../annotations'
import { ContextStep } from '../core/contextStep'

export class TableDiscoveryStep extends ContextStep {
    protected tableNameEnvRegexp = /_TABLE_NAME$/
    public async execute(context) {
        const tablesToCreate = new Map()

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
                    if (this.tableNameEnvRegexp.test(key) && !tablesToCreate.has(metadata[key])) {
                        tablesToCreate.set(metadata[key], {
                            TableName: metadata[key]
                        })
                    }
                }
            }
        }

        context.tableConfigs = Array.from(tablesToCreate.values())
    }
}


export const tableDiscovery = new TableDiscoveryStep('tableDiscovery')