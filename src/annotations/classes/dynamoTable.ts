import { merge } from 'lodash'

import { CLASS_DYNAMOTABLECONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates, environment } from './environment'

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



export const dynamoTable = (tableConfig: {
    tableName: string,
    environmentKey?: string,
    nativeConfig?: any
}) => (target: Function) => {
    let tableDefinitions = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, target) || [];

    tableConfig.environmentKey = tableConfig.environmentKey || '%ClassName%_TABLE_NAME'
    tableConfig.nativeConfig = merge({}, __dynamoDBDefaults, tableConfig.nativeConfig)

    const { templatedKey, templatedValue } = applyTemplates(tableConfig.environmentKey, tableConfig.tableName, target)
    tableDefinitions.push(merge({}, tableConfig, {
        environmentKey: templatedKey,
        tableName: templatedValue,
        definedBy: target.name
    }))

    defineMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, [...tableDefinitions], target)

    const environmentSetter = environment(templatedKey, templatedValue)
    environmentSetter(target)
}