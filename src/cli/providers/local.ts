import { collectAndCreateTables } from '../utilities/aws/dynamoDB'
import { getMetadata, constants } from '../../annotations'

export const createEnvironment = async (context) => {
    await collectAndCreateTables(context)
}
