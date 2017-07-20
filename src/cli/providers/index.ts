import * as aws from './aws'
import * as local from './local'

let environments = { aws, local }

export const createEnvironment = async (context) => {

    let currentEnvironment = environments[context.deployTarget]

    if (!currentEnvironment) {
        throw new Error(`unhandled deploy target: '${context.deployTarget}'`)
    }

    await currentEnvironment.createEnvironment(context)
}