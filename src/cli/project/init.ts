export { internalPluginLoad } from './core/loadPlugins'
import { readConfig } from './core/readConfig'
import { loadPlugins } from './core/loadPlugins'
import { projectConfig, updateConfig, setPluginDefinitions, getPluginDefinitions } from './config'

import { logger } from '../utilities/logger'
import { resolvePath } from '../utilities/cli'
import { contextSteppes, createContext } from '../context'
import * as annotations from '../../annotations'

export const pluginInitParam: any = {
    logger,
    resolvePath,
    contextSteppes, createContext,
    annotations,
    projectConfig,
    getPluginDefinitions
}

export const init = (commander) => {

    const configJson = readConfig()
    updateConfig(configJson)
    const plugins = loadPlugins(projectConfig)

    // init plugins
    for (const pluginInfo of plugins) {
        try {

            const pluginConfig = pluginInfo.init(pluginInitParam)

            setPluginDefinitions({
                pluginInfo,
                config: pluginConfig || {}
            })

        } catch (e) {
            logger.error(`Plugin '${pluginInfo.path}' not loaded correctly`, e)
        }
    }


    // init commands
    const pluginDefinitions = getPluginDefinitions()
    for (const plugin of pluginDefinitions) {
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

