import * as aws from './aws'
import * as local from './local'
import * as cf from './cloudFormation'
import { setFunctionalEnvironment } from '../context'

let environments = { aws, local, cf }

export const createEnvironment = async (context) => {

    let currentEnvironment = environments[context.deployTarget]

    if (!currentEnvironment) {
        throw new Error(`unhandled deploy target: '${context.deployTarget}'`)
    }

    if (currentEnvironment.FUNCTIONAL_ENVIRONMENT) {
        context.FUNCTIONAL_ENVIRONMENT = currentEnvironment.FUNCTIONAL_ENVIRONMENT
        setFunctionalEnvironment(context)
    }

    await currentEnvironment.createEnvironment(context)
}