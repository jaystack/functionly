export { contextSteppes, ContextStep } from './core/contextStep'

import { serviceDiscovery } from './steppes/serviceDiscovery'
import { tableDiscovery } from './steppes/tableDiscovery'
import './steppes/setFunctionalEnvironment'

import { resolvePath } from '../utilities/cli'
import { logger } from '../utilities/logger'
import { defaults } from 'lodash'

import { projectConfig } from '../project/config'
import {
    cliCallContextHooks, hasCliCallContextHooks, CONTEXT_HOOK_MODIFIER_BEFORE, CONTEXT_HOOK_MODIFIER_AFTER,
    callContextHookStep
} from '../extensions/hooks'

export const getDefaultSteppes = (): any[] => {
    return [
        callContextHookStep,
        serviceDiscovery,
        tableDiscovery
    ]
}

export const createContext = async (path, defaultValues) => {
    const context = defaults(new Context(), {
        serviceRoot: resolvePath(path),
        date: new Date()
    }, defaultValues)

    const defaultSteppes = getDefaultSteppes()
    for (const step of defaultSteppes) {
        await context.runStep(step)
    }

    return context
}

let depth = 0
export class Context {
    [p: string]: any

    public async runStep(step: Function | any) {


        let result = undefined
        if (typeof step === 'function') {
            result = await step(this)
        } else if (step && step.name && typeof step.execute === 'function') {

            const tab = depth++
            const separator = (s = '  ') => {
                let result = ''
                for (var i = 0; i < tab; i++) {
                    result += s
                }
                return result
            }

            try {

                if (projectConfig.debug) logger.debug(`Context step run -----------${separator('--')}> ${step.name}`)
                if (projectConfig.debug) logger.debug(`Context step before start   ${separator()}  ${step.name}`)
                await cliCallContextHooks(step.name, this, CONTEXT_HOOK_MODIFIER_BEFORE)
                if (projectConfig.debug) logger.debug(`Context step before end     ${separator()}  ${step.name}`)

                if (projectConfig.debug) logger.debug(`Context step start          ${separator()}  ${step.name}`)
                if (hasCliCallContextHooks(step.name, this)) {
                    result = await cliCallContextHooks(step.name, this)
                } else {
                    result = await step.execute(this)
                }
                if (projectConfig.debug) logger.debug(`Context step end            ${separator()}  ${step.name}`)

                if (projectConfig.debug) logger.debug(`Context step after start    ${separator()}  ${step.name}`)
                await cliCallContextHooks(step.name, this, CONTEXT_HOOK_MODIFIER_AFTER)
                if (projectConfig.debug) logger.debug(`Context step after end      ${separator()}  ${step.name}`)
                if (projectConfig.debug) logger.debug(`Context step complete ------${separator('--')}> ${step.name}`)
            }
            catch (e) {
                if (projectConfig.debug) logger.debug(`Context step exited --------${separator('--')}> ${step.name}`)
                depth--
                throw e
            }
            depth--
        } else {
            throw new Error(`context.runStep has invalid parameter '${step}'`)
        }
        return result
    }
}


