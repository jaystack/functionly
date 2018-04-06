import { merge } from 'lodash'
import { join } from 'path'

export const projectConfig: any = {}
export const updateConfig = (values) => merge(projectConfig, values)

export const pluginDefinitions = []
export const setPluginDefinitions = (pluginDefinition) => pluginDefinitions.push(pluginDefinition)
export const getPluginDefinitions = () => pluginDefinitions

try {
    const packageJson = require(join(process.cwd(), 'package'))
    if (packageJson && packageJson.version) {
        projectConfig.version = packageJson.version
    }
    if (!projectConfig.name && packageJson && packageJson.name) {
        projectConfig.name = packageJson.name
    }
} catch (e) { }
