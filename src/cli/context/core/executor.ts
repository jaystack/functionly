
import { logger } from '../../utilities/logger'
import { projectConfig } from '../../project/config'
import {
    cliCallContextHooks, hasCliCallContextHooks, CONTEXT_HOOK_MODIFIER_BEFORE, CONTEXT_HOOK_MODIFIER_AFTER,
    callContextHookStep
} from '../../extensions/hooks'

let depth = 0
export const executor = async (context, step?: Function | any) => {
    if (!step) {
        step = context;
        context = context.context
    }

    let result = undefined
    if (typeof step === 'function') {
        result = await step(context)
    } else if (step && step.name && typeof step.method === 'function') {
        const tab = depth++
        const separator = (s = '  ') => {
            let result = ''
            for (var i = 0; i < tab; i++) {
                result += s
            }
            return result
        }

        try {

            if (projectConfig.debug) logger.debug(`executor  |   run -----------${separator('--')}> ${step.name}`)
            if (projectConfig.debug) logger.debug(`executor  |   before start   ${separator()}  ${step.name}`)
            await cliCallContextHooks(step.name, context, CONTEXT_HOOK_MODIFIER_BEFORE)
            if (projectConfig.debug) logger.debug(`executor  |   before end     ${separator()}  ${step.name}`)

            if (projectConfig.debug) logger.debug(`executor  |   start          ${separator()}  ${step.name}`)
            if (hasCliCallContextHooks(step.name, context)) {
                result = await cliCallContextHooks(step.name, context)
            } else {
                result = await step.method(context)
            }
            if (projectConfig.debug) logger.debug(`executor  |   end            ${separator()}  ${step.name}`)

            if (projectConfig.debug) logger.debug(`executor  |   after start    ${separator()}  ${step.name}`)
            await cliCallContextHooks(step.name, context, CONTEXT_HOOK_MODIFIER_AFTER)
            if (projectConfig.debug) logger.debug(`executor  |   after end      ${separator()}  ${step.name}`)
            if (projectConfig.debug) logger.debug(`executor  |   complete ------${separator('--')}> ${step.name}`)
        }
        catch (e) {
            if (projectConfig.debug) logger.debug(`executor  |   exited --------${separator('--')}> ${step.name}`)
            depth--
            throw e
        }
        depth--
    } else {
        throw new Error(`runStep has invalid parameter '${step}'`)
    }
    return result
}


