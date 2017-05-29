import { getFunctionName } from '../../../annotations'
import { bundle } from '../../utilities/webpack'
import { zip } from '../../utilities/compress'
import { uploadZip } from '../../utilities/aws/s3Upload'
import { createStack, updateStack, getTemplate } from '../../utilities/aws/cloudFormation'

import { cloudFormationInit } from './context/cloudFormationInit'
import { tableResources, lambdaResources, roleResources } from './context/resources'
import { uploadTemplate } from './context/uploadTemplate'

export const FUNCTIONAL_ENVIRONMENT = 'aws'

export const createEnvironment = async (context) => {
    await bundle(context)
    await zip(context)
    await uploadZip(context, `services-${context.date.toISOString()}.zip`, context.zipData())


    await cloudFormationInit(context)
    await roleResources(context)
    await tableResources(context)
    await lambdaResources(context)

    await uploadTemplate(context)

    try {
        await getTemplate(context)
        await updateStack(context)
        console.log('updated')
    } catch (e) {
        if (/^Stack with id .* does not exist$/.test(e.message)) {
            await createStack(context)
            console.log('created')
        } else {
            console.log(e)
            throw e
        }
    }
}


