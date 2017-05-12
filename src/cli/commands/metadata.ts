import { serviceDiscovery } from '../utilities/serviceDiscovery'
import { local } from '../utilities/local'
import { resolvePath } from '../utilities/cli'
import { getMetadata, getMetadataKeys } from '../../annotations'

export const init = (commander) => {
    commander
        .command('metadata <target> <path>')
        .description('service metadata')
        .action(async (target, path, command) => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'deploy'

            let context: any = {
                deployTarget: target,
                serviceRoot: resolvePath(path)
            }

            try {
                await serviceDiscovery(context)

                console.log(JSON.stringify(context, null, 4))

                for (let serviceDefinitions of context.publishedFunctions) {
                    let keys = getMetadataKeys(serviceDefinitions.service)
                    let metadata = {}
                    for (let key of keys) {
                        metadata[key] = getMetadata(key, serviceDefinitions.service)
                    }

                    console.log(serviceDefinitions.handler, JSON.stringify(metadata, null, 4))
                }


                console.log(`done`)
            } catch (e) {
                console.log(`error`, e)
            }
        });
}