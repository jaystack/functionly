import { constants, getMetadata, getOverridableMetadata } from '../../annotations'
const { PARAMETER_PARAMKEY } = constants
import { getMiddlewares } from '../../annotations/classes/use'
import { callExtension, PreHook, PostHook } from '../../classes'

export abstract class Provider {
    public getInvoker(serviceInstance, params): Function {
        const invoker = () => { }
        return invoker
    }

    public async invoke(serviceInstance, params, invokeConfig?): Promise<any> {

    }

    public async invokeExec(config: any): Promise<any> {

    }

    protected async parameterResolver(parameter, context): Promise<any> {
        const implementation = this.getParameterDecoratorImplementation(parameter.type) || (() => { })
        return implementation(parameter, context, this)
    }

    protected createCallContext(target, method) {
        const hooks = getMiddlewares(target).map(m => new m())
        const parameters = this.getParameters(target.constructor, method)

        const preHooks = hooks.filter(h => h instanceof PreHook)
            .map(h => this.createCallContext(h, 'handle'))
        const postHookInstances = hooks.filter(h => h instanceof PostHook)
        const postHooks = postHookInstances.map(h => this.createCallContext(h, 'handle'))
        const catchHooks = postHookInstances.map(h => this.createCallContext(h, 'catch'))

        return async (context) => {
            const preic: any = {}
            const preContext = { context: preic, ...context }

            try {
                for (const hook of preHooks) {
                    await hook(preContext)
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
                        ic.result = await catchHooks[hookIndex](postContext)
                    } else {
                        ic.result = await postHooks[hookIndex](postContext)
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
    const event = context.event
    const serviceType = parameter.serviceType

    const staticInstance = await callExtension(serviceType, 'onInject', { parameter })
    if (typeof staticInstance !== 'undefined') {
        return staticInstance
    }

    const instance = new serviceType(...parameter.params.map((p) => typeof p === 'function' ? p() : p))
    await callExtension(instance, 'onInject', { parameter })
    return instance
})

Provider.addParameterDecoratorImplementation("serviceParams", async (parameter, context, provider) => {
    return context.event
})

Provider.addParameterDecoratorImplementation("context", async (parameter, context, provider) => {
    return context.context
})
Provider.addParameterDecoratorImplementation("error", async (parameter, context, provider) => {
    return parameter.targetKey === 'catch' ? (context.context && context.context.error) : undefined
})