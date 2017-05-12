import { serviceDiscovery } from '../utilities/serviceDiscovery'
import { deploy } from '../utilities/deploy'
import { resolvePath } from '../utilities/cli'

export const init = (commander) => {
    commander
        .command('deploy <target> <path>')
        .description('deploy functional services')
        .action(async (target, path, command) => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'deploy'

            let context: any = {
                deployTarget: target,
                serviceRoot: resolvePath(path)
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