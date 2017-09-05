import { constants, getMetadata, getOverridableMetadata, getFunctionName } from '../../annotations'
const { PARAMETER_PARAMKEY } = constants
import { getMiddlewares } from '../../annotations/classes/use'
import { callExtension, PreHook, PostHook } from '../../classes'
import { container } from '../../helpers/ioc'

export abstract class Provider {
    public getInvoker(serviceInstance, params): Function {
        const invoker = () => { }
        return invoker
    }

    public async invoke(serviceInstance, params, invokeConfig?): Promise<any> {

    }

    public async invokeExec(config: any): Promise<any> {

    }

    public async createInstance(type, context) {
        if (container.contains(type)) {
            return container.resolve<any>(type)
        }

        const parameters = this.getParameters(type, undefined)

        const params = []
        for (const parameter of parameters) {
            params[parameter.parameterIndex] = await this.parameterResolver(parameter, context)
        }

        const instance = container.resolve<any>(type, ...params)

        if (typeof instance.init === 'function') {
            await instance.init()
        }

        return instance
    }

    protected async parameterResolver(parameter, context): Promise<any> {
        const implementation = this.getParameterDecoratorImplementation(parameter.type) || (() => { })
        return implementation(parameter, context, this)
    }

    protected createCallContext(target, method) {
        const hooks = getMiddlewares(target).map(m => container.resolve(m))
        const parameters = this.getParameters(target.constructor, method)

        const preHooks = hooks.filter(h => h instanceof PreHook)
            .map(h => ({ hookKey: h.constructor.name, hook: this.createCallContext(h, 'handle') }))
        const postHookInstances = hooks.filter(h => h instanceof PostHook)
        const postHooks = postHookInstances.map(h => ({ hookKey: h.constructor.name, hook: this.createCallContext(h, 'handle') }))
        const catchHooks = postHookInstances.map(h => ({ hookKey: h.constructor.name, hook: this.createCallContext(h, 'catch') }))

        return async (context) => {
            const preic: any = {}
            const preContext = { context: preic, ...context }

            try {
                for (const { hookKey, hook } of preHooks) {
                    const result = await hook(preContext)
                    if (hookKey) {
                        preic[hookKey] = result
                    }
                }

                const params = []
                for (const parameter of parameters) {
                    params[parameter.parameterIndex] = await this.parameterResolver(parameter, preContext)
                }

                preic.result = await target[method](...params)
                preic.error = undefined
            } catch (e) {
                preic.error = e
                preic.result = undefined
            }

            const ic = { ...preic }
            const postContext = { ...preContext, context: ic }
            for (let hookIndex = 0; hookIndex < postHookInstances.length; hookIndex++) {
                try {
                    if (ic.error) {
                        ic.result = await catchHooks[hookIndex].hook(postContext)
                    } else {
                        ic.result = await postHooks[hookIndex].hook(postContext)
                    }
                    ic.error = undefined
                } catch (e) {
                    ic.error = e
                }
            }

            if (ic.error) throw ic.error
            return ic.result
        }
    }

    protected getParameters(target, method) {
        return (getOverridableMetadata(PARAMETER_PARAMKEY, target, method) || [])
            .filter(t => t && typeof t.parameterIndex === 'number');
    }

    public static __supportedDecorators: { [key: string]: Function }
    public static __getDecoratorHolder() {
        return this.__supportedDecorators = this.hasOwnProperty('__supportedDecorators') ? this.__supportedDecorators : {}
    }
    public static addParameterDecoratorImplementation(parameterType: string, implementation: Function) {
        this.__getDecoratorHolder()[parameterType] = implementation
    }

    public static getParameterDecoratorImplementation(parameterType: string) {
        return this.__getDecoratorHolder()[parameterType] ||
            (this['__proto__'].getParameterDecoratorImplementation && this['__proto__'].getParameterDecoratorImplementation(parameterType))
    }
    protected getParameterDecoratorImplementation(parameterType: string) {
        return this.constructor['getParameterDecoratorImplementation'](parameterType)
    }
}

Provider.addParameterDecoratorImplementation("inject", async (parameter, context, provider) => {
    const serviceType = parameter.serviceType

    const staticInjectValue = await callExtension(serviceType, 'onInject', { parameter, context, provider })
    if (typeof staticInjectValue !== 'undefined') {
        return staticInjectValue
    }

    const instance = await provider.createInstance(serviceType, context)

    await callExtension(instance, 'onInject', { parameter, context, provider })
    return instance
})

Provider.addParameterDecoratorImplementation("serviceParams", async (parameter, context, provider) => {
    return context.event
})

Provider.addParameterDecoratorImplementation("error", async (parameter, context, provider) => {
    return parameter.targetKey === 'catch' ? (context.context && context.context.error) : undefined
})
Provider.addParameterDecoratorImplementation("result", async (parameter, context, provider) => {
    return context.context && context.context.result
})
Provider.addParameterDecoratorImplementation("functionalServiceName", async (parameter, context, provider) => {
    return context.serviceInstance && getFunctionName(context.serviceInstance)
})
Provider.addParameterDecoratorImplementation("provider", async (parameter, context, provider) => {
    return process.env.FUNCTIONAL_ENVIRONMENT
})
Provider.addParameterDecoratorImplementation("stage", async (parameter, context, provider) => {
    return process.env.FUNCTIONAL_STAGE
})