import { getMetadata, defineMetadata, constants, result } from '../../annotations'
import { getMiddlewares } from '../../annotations/classes/use'
const { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY } = constants

export class Hook {
    public handle(...params);
    public handle( @result res) {
        return res
    }

    public static onDefineMiddlewareTo(target) {
        const targetTkey = 'handle'

        const injectedDefinitions: any[] = (getMetadata(PARAMETER_PARAMKEY, this, targetTkey) || [])
            .filter(p => p.type === 'inject')

        for (const { serviceType, targetKey, parameterIndex } of injectedDefinitions) {
            if (typeof serviceType.onDefineInjectTo === 'function') {
                serviceType.onDefineInjectTo(target, targetTkey, parameterIndex)
            }
        }

        const middlewares = getMiddlewares(this)
        for (const middleware of middlewares) {
            if (typeof middleware.onDefineMiddlewareTo === 'function') {
                middleware.onDefineMiddlewareTo(target)
            }
        }

        const metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}
        const injectMetadata = getMetadata(CLASS_ENVIRONMENTKEY, this) || {}
        if (injectMetadata) {
            Object.keys(injectMetadata).forEach((key) => {
                metadata[key] = injectMetadata[key]
            })
            defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
        }
    }

    public static onInject({ parameter, context }) {
        const key = parameter.serviceType && parameter.serviceType.name
        if (key && context.context && typeof context.context[key] !== 'undefined') {
            return context.context[key]
        }
        return null
    }
}