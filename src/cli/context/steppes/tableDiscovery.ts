import { getMetadata, constants } from '../../../annotations'
import { ExecuteStep } from '../core/executeStep'
import { collectMetadata } from '../../utilities/collectMetadata'
const { CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_ENVIRONMENTKEY } = constants

export class TableDiscoveryStep extends ExecuteStep {
    public async method(context) {
        context.tableConfigs = collectMetadata(context, {
            metadataKey: CLASS_DYNAMOTABLECONFIGURATIONKEY,
            selector: (c) => c.tableName
        })
    }
}


export const tableDiscovery = new TableDiscoveryStep('TableDiscovery')
