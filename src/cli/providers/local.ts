import { createTables } from '../utilities/aws/dynamoDB'
import { getMetadata, constants } from '../../annotations'

export const FUNCTIONAL_ENVIRONMENT = 'local'

export const createEnvironment = async (context) => {
    await context.runStep({ name: 'createTables', execute: createTables })
}
