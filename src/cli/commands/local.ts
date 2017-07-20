import { serviceDiscovery } from '../utilities/serviceDiscovery'
import { local } from '../utilities/local'
import { resolvePath } from '../utilities/cli'

export const init = (commander) => {
    commander
        .command('local <port> <path>')
        .description('run functional service local')
        .action(async (port, path, command) => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            let context: any = {
                deployTarget: 'local',
                localPort: port,
                serviceRoot: resolvePath(path)
            }

            try {
                await serviceDiscovery(context)
                await local(context)

                console.log(`done`)
            } catch (e) {
                console.log(`error`, e)
            }
        });
}