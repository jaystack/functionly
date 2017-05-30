import { readConfig } from './core/readConfig'
import { loadPlugins } from './core/loadPlugins'

import { logger } from '../utilities/logger'
import { resolvePath } from '../utilities/cli'


export const pluginDefinition = []

export const init = (commander) => {

    const config = readConfig()
    const plugins = loadPlugins(config)

    // init plugins
    for (const pluginInfo of plugins) {
        try {

            const pluginConfig = pluginInfo.init({
                logger,
                resolvePath
            })

            pluginDefinition.push({
                pluginInfo,
                config: pluginConfig || {}
            })

        } catch (e) {
            logger.error(`Plugin '${pluginInfo.path}' not loaded correctly`, e)
        }
    }


    // init commands
    for (const plugin of pluginDefinition) {
        try {
            if (plugin.config.commands) {

                plugin.config.commands({
                    commander
                })
            }
        } catch (e) {
            logger.error(`Plugin '${plugin.pluginInfo.path}' commands not loaded correctly`, e)
        }
    }

}

