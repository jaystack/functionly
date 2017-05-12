import * as aws from './aws'

export const uploadServices = async (context) => {

    switch (context.deployTarget) {
        case 'aws':
            await aws.createLambda(context)
            break
        default:
            console.log(`unhandled deploy target: '${context.deployTarget}'`)
    }

}