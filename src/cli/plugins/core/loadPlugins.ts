import { readFileSync } from 'fs'
import { logger } from '../../utilities/logger'
import { resolvePath } from '../../utilities/cli'

export const PLUGIN_FOLDER = './node_modules/'
export const PLUGIN_PREFIX = 'functionly-plugin-'
export const PLUGIN_PATH_REGEXP = /^\./

export const loadPlugins = (config) => {
    const pluginInitializers: any[] = []

    const cwd = process.cwd()

    if (Array.isArray(config.plugins)) {
        for (const pluginPath of config.plugins) {
            
            let resolvedPluginPath = null
            if (PLUGIN_PATH_REGEXP.test(pluginPath)) {
                resolvedPluginPath = resolvePath(pluginPath)
            } else {
                resolvedPluginPath = resolvePath(`${PLUGIN_FOLDER}${PLUGIN_PREFIX}${pluginPath}`)
            }

            try {
                const pluginInit = require(resolvedPluginPath)

                pluginInitializers.push({
                    init: pluginInit.default,
                    path: pluginPath,
                    resolvedPath: resolvedPluginPath
                })

            } catch (e) {
                logger.error(`Plugin '${pluginPath}' not exists`, e)
            }
        }
    }

    return pluginInitializers;
}
