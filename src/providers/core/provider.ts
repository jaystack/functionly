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


    protected async parameterResolver(parameter, event): Promise<any> {
        switch (parameter.type) {
            case 'inject':
                const serviceType = parameter.serviceType

                const staticInstance = await callExtension(serviceType, 'onInject', { parameter })
                if (typeof staticInstance !== 'undefined') {
                    return staticInstance
                }

                const instance = new serviceType(...parameter.params.map((p) => typeof p === 'function' ? p() : p))
                await callExtension(instance, 'onInject', { parameter })
                return instance
            case 'event': 
                return event;
            default:
                return undefined
        }
    }

    protected getParameters(target, method) {
        return (getOwnMetadata(constants.PARAMETER_PARAMKEY, target, 'handle') || [])
            .filter(t => t && typeof t.parameterIndex === 'number');
    }
}

