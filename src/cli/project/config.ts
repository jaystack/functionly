import { merge } from 'lodash'

export const projectConfig: any = {}
export const updateConfig = (values) => merge(projectConfig, values)

export const pluginDefinitions = []
export const setPluginDefinitions = (pluginDefinition) => pluginDefinitions.push(pluginDefinition)
export const getPluginDefinitions = () => pluginDefinitions