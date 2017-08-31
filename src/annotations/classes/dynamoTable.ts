import { CLASS_DYNAMOTABLECONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { environment } from './environment'
import { createClassDecorator, ArrayDecorator } from '../decorators'

export const DYNAMO_TABLE_NAME_SUFFIX = '_TABLE_NAME'

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

// export const dynamoTable = (tableConfig: {
//     tableName: string,
//     environmentKey?: string,
//     nativeConfig?: any
// }) => (target: Function) => {
//     let tableDefinitions = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, target) || [];

//     tableConfig.environmentKey = tableConfig.environmentKey || `%ClassName%${DYNAMO_TABLE_NAME_SUFFIX}`
//     tableConfig.nativeConfig = { ...__dynamoDBDefaults, ...tableConfig.nativeConfig }

//     const { templatedKey, templatedValue } = applyTemplates(tableConfig.environmentKey, tableConfig.tableName, target)
//     tableDefinitions.push({
//         ...tableConfig,
//         environmentKey: templatedKey,
//         tableName: templatedValue,
//         definedBy: target.name
//     })

//     defineMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, [...tableDefinitions], target)

//     const environmentSetter = environment(templatedKey, templatedValue)
//     environmentSetter(target)
// }

export type DynamoTableProps = { tableName: string, environmentKey?: string, nativeConfig?: any }
export class DynamoTableDecorator extends ArrayDecorator<DynamoTableProps>{
    public decorator(value: DynamoTableProps, metadata, target: Function) {

        value.environmentKey = value.environmentKey || `%ClassName%${DYNAMO_TABLE_NAME_SUFFIX}`
        value.nativeConfig = { ...__dynamoDBDefaults, ...value.nativeConfig }

        const { templatedKey, templatedValue } = applyTemplates(value.environmentKey, value.tableName, target)
        const definitionValue = {
            ...value,
            environmentKey: templatedKey,
            tableName: templatedValue,
            definedBy: target.name
        }

        return [...metadata, definitionValue]
    }
    public metadata({ value, serviceDefinition, metadata }) {
        metadata.dynamoTables = metadata.dynamoTables || []
        let def = metadata.dynamoTables.find(d => d.tableName === value.tableName)
        if (!def) {
            def = value
            metadata.dynamoTables.push(def)
        }

        serviceDefinition.dynamoTables = serviceDefinition.dynamoTables || []
        serviceDefinition.dynamoTables.push(def)

    }
}
export const dynamoTable = createClassDecorator<DynamoTableProps>(new DynamoTableDecorator({ nativeConfig: __dynamoDBDefaults }))
