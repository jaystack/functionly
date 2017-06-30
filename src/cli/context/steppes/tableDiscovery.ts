import { getMetadata, constants, __dynamoDBDefaults } from '../../../annotations'
import { DYNAMO_TABLE_NAME_SUFFIX } from '../../../annotations/classes/dynamoTable'
import { ExecuteStep } from '../core/executeStep'
import { collectMetadata } from '../../utilities/collectMetadata'
const { CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_ENVIRONMENTKEY } = constants

export class TableDiscoveryStep extends ExecuteStep {
    public async method(context) {
        context.tableConfigs = collectMetadata(context, {
            metadataKey: CLASS_DYNAMOTABLECONFIGURATIONKEY,
            selector: (c) => c.tableName,
            environmentRegexp: new RegExp(`${DYNAMO_TABLE_NAME_SUFFIX}$`),
            keyProperty: 'environmentKey',
            valueProperty: 'tableName',
            defaultServiceConfig: { nativeConfig: __dynamoDBDefaults }
        })
    }
}


export const tableDiscovery = new TableDiscoveryStep('TableDiscovery')
