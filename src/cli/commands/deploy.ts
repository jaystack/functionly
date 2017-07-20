import { serviceDiscovery } from '../utilities/serviceDiscovery'
import { deploy } from '../utilities/deploy'
import { resolvePath } from '../utilities/cli'

export const init = (commander) => {
    commander
        .command('deploy <target> <path>')
        .description('deploy functional services')
        .option('--aws-region <awsRegion>', 'AWS_REGION')
        .option('--aws-bucket <awsBucket>', 'aws bucket')
        .action(async (target, path, command) => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'deploy'

            let context: any = {
                deployTarget: target,
                serviceRoot: resolvePath(path),
                awsRegion: command.awsRegion,
                awsBucket: command.awsBucket
            }

            try {
                await serviceDiscovery(context)
                await deploy(context)

                console.log(`done`)
            } catch (e) {
                console.log(`error`, e)
            }
        });
}