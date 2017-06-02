import { createTables } from '../utilities/aws/dynamoDB'
import { getMetadata, constants } from '../../annotations'
import { ContextStep } from '../context'

export const FUNCTIONAL_ENVIRONMENT = 'local'

export const createEnvironment = ContextStep.register('createEnvironment_local', async (context) => {
    await context.runStep(createTables)
})
