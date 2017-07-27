import { getMetadata, defineMetadata, constants, context } from '../../annotations'
import { getMiddlewares } from '../../annotations/classes/use'
const { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY } = constants

export class Hook {
    public handle(...params);
    public handle( @context context) {
        return context.result
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
}