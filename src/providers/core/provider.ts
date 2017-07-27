import { constants, getOwnMetadata } from '../../annotations'
import { callExtension } from '../../classes'

export abstract class Provider {
    public getInvoker(serviceType, serviceInstance, params): Function {
        const invoker = () => { }
        return invoker
    }

    public async invoke(serviceInstance, params, invokeConfig?): Promise<any> {

    }

    public async invokeExec(config: any): Promise<any> {

    }

    protected async parameterResolver(parameter, context): Promise<any> {
        const implementation = this.getParameterDecoratorImplementation(parameter.type) || (() => {})
        return implementation(parameter, context, this)
    }

    protected getParameters(target, method) {
        return (getOwnMetadata(constants.PARAMETER_PARAMKEY, target, 'handle') || [])
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
