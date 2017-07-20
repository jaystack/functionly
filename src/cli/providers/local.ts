import { createTables } from '../utilities/aws/dynamoDB'
import { getMetadata, constants } from '../../annotations'
import { ExecuteStep, executor } from '../context'

export const local = {
    FUNCTIONAL_ENVIRONMENT: 'local',
    createEnvironment: ExecuteStep.register('CreateEnvironment_local', async (context) => {
        await executor(context, createTables)
    })
}
