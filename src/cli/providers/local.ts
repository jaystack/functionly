import { createTables } from '../utilities/aws/dynamoDB'
import { getMetadata, constants } from '../../annotations'
import { ContextStep } from '../context'

export const local = {
    FUNCTIONAL_ENVIRONMENT: 'local',
    createEnvironment: ContextStep.register('createEnvironment_local', async (context) => {
        await context.runStep(createTables)
    })
}
