import { deploy } from '../utilities/deploy'
import { createContext } from '../context'

export const init = (commander) => {
    commander
        .command('deploy <target> <path>')
        .description('deploy functional services')
        .option('--aws-region <awsRegion>', 'AWS_REGION')
        .option('--aws-bucket <awsBucket>', 'aws bucket')
        .action(async (target, path, command) => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'deploy'

            const context = await createContext(path, {
                deployTarget: target,
                awsRegion: command.awsRegion,
                awsBucket: command.awsBucket
            })

            try {
                await deploy(context)

                console.log(`done`)
            } catch (e) {
                console.log(`error`, e)
            }
        });
}