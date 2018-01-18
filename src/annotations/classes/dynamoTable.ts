import { CLASS_DYNAMOTABLECONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { environment } from './environment'

export const __dynamoDBDefaults = {
    AttributeDefinitions: [
        {
            AttributeName: "id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 2,
        WriteCapacityUnits: 2
    }
}

export const dynamoTable = (tableConfig?: {
    tableName?: string,
    environmentKey?: string,
    nativeConfig?: any,
    exists?: boolean
}) => (target: Function) => {
    let tableDefinitions = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, target) || [];

    tableConfig = tableConfig || {}
    tableConfig.tableName = tableConfig.tableName || `%ClassName%-table`
    tableConfig.environmentKey = tableConfig.environmentKey || `%ClassName%_TABLE_NAME`
    tableConfig.nativeConfig = { ...__dynamoDBDefaults, ...tableConfig.nativeConfig }

    const { templatedKey, templatedValue } = applyTemplates(tableConfig.environmentKey, tableConfig.tableName, target)
    tableDefinitions.push({
        ...tableConfig,
        environmentKey: templatedKey,
        tableName: templatedValue,
        definedBy: target.name
    })

    defineMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, [...tableDefinitions], target)

    const environmentSetter = environment(templatedKey, templatedValue)
    environmentSetter(target)
}

export const dynamo = dynamoTable
