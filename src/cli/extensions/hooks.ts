import { ContextStep } from '../context/core/contextStep'
import { getPluginDefinitions, projectConfig } from '../project/config'
import { logger } from '../utilities/logger'

export const CONTEXT_HOOK_MODIFIER_BEFORE = 'before'
export const CONTEXT_HOOK_MODIFIER_AFTER = 'after'
export const CONTEXT_HOOK_PROPERTIES = '__hooks'
export const CONTEXT_HOOK_DEFAULT_MODIFIER = 'default'
export const CONTEXT_HOOK_SEPARATOR = ':'

export const hasCliCallContextHooks = (name, context, modifier = CONTEXT_HOOK_DEFAULT_MODIFIER) => {
    return context &&
        context[CONTEXT_HOOK_PROPERTIES] &&
        context[CONTEXT_HOOK_PROPERTIES][modifier] &&
        typeof context[CONTEXT_HOOK_PROPERTIES][modifier][name] === 'function' ? true : false
}

export const cliCallContextHooks = async (name, context, modifier = CONTEXT_HOOK_DEFAULT_MODIFIER) => {
    if (context &&
        context[CONTEXT_HOOK_PROPERTIES] &&
        context[CONTEXT_HOOK_PROPERTIES][modifier] &&
        typeof context[CONTEXT_HOOK_PROPERTIES][modifier][name] === 'function'
    ) {
        return await context[CONTEXT_HOOK_PROPERTIES][modifier][name](context)
    }
}

export const callContextHookStep = (context) => {
    context[CONTEXT_HOOK_PROPERTIES] = {}

    const pluginDefinitions = getPluginDefinitions()
    for (const plugin of pluginDefinitions) {
        if (plugin.config.hooks && typeof plugin.config.hooks === 'object') {
            const keys = Object.keys(plugin.config.hooks)

            for (const key of keys) {
                if (typeof plugin.config.hooks[key] !== 'function') {
                    logger.warn(`hook '${key}' in '${plugin.pluginInfo.path}' is invalid`)
                    continue
                }

                let [modifier, stepName] = key.split(CONTEXT_HOOK_SEPARATOR)
                if (!stepName) {
                    stepName = modifier
                    modifier = CONTEXT_HOOK_DEFAULT_MODIFIER
                }
                if (!stepName) continue

                context[CONTEXT_HOOK_PROPERTIES][modifier] = context[CONTEXT_HOOK_PROPERTIES][modifier] || {}
                context[CONTEXT_HOOK_PROPERTIES][modifier][stepName] = plugin.config.hooks[key]
            }

        }
    }
}
