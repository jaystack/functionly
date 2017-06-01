import { callExtension } from '../../classes'
import { getPluginDefinitions } from '../project/config'

export const cliCallExtension = (target: any, method: string, ...params) => {
    callExtension(target, method, ...params)

    const pluginDefinitions = getPluginDefinitions()
    for (const plugin of pluginDefinitions) {
        if (plugin.config.extensions && typeof plugin.config.extensions[method] === 'function') {

            plugin.config.extensions[method](...params)
        }
    }
}