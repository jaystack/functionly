import { getFunctionName } from '../../../annotations'
import { bundle } from '../../utilities/webpack'
import { zip } from '../../utilities/compress'
import { uploadZipStep } from '../../utilities/aws/s3Upload'
import { createStack, updateStack, getTemplate } from '../../utilities/aws/cloudFormation'

import { cloudFormationInit } from './context/cloudFormationInit'
import { tableResources, lambdaResources, roleResources } from './context/resources'
import { uploadTemplate } from './context/uploadTemplate'

export const FUNCTIONAL_ENVIRONMENT = 'aws'

export const createEnvironment = async (context) => {
    await context.runStep(bundle)
    await context.runStep(zip)
    await context.runStep(uploadZipStep(`services-${context.date.toISOString()}.zip`, context.zipData()))

    await context.runStep(cloudFormationInit)
    await context.runStep(roleResources)
    await context.runStep(tableResources)
    await context.runStep(lambdaResources)

    await context.runStep(uploadTemplate)

    try {
        await context.runStep(getTemplate)
        await context.runStep(updateStack)
        console.log('updated')
    } catch (e) {
        if (/^Stack with id .* does not exist$/.test(e.message)) {
            await context.runStep(createStack)
            console.log('created')
        } else {
            console.log(e)
            throw e
        }
    }
}


