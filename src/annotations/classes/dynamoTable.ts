import { merge } from 'lodash'

import { Class_DynamoTableConfigurationKey } from '../constants'
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
    environmentKey: string,
    tableName: string,
    config?: any
}) => (target: Function) => {
    let tableDefinitions = getMetadata(Class_DynamoTableConfigurationKey, target) || [];

    tableConfig.config = merge({}, __dynamoDBDefaults, tableConfig.config)

    const { templatedKey, templatedValue } = applyTemplates(tableConfig.environmentKey, tableConfig.tableName, target)
    tableDefinitions.push(merge({}, tableConfig, {
        environmentKey: templatedKey,
        tableName: templatedValue,
        definedBy: target.name
    }))

    defineMetadata(Class_DynamoTableConfigurationKey, [...tableDefinitions], target)

    const environmentSetter = environment(templatedKey, templatedValue)
    environmentSetter(target)
}
