import { CLASS_MIDDLEWAREKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'

export const use = (...middlewares) => {
    return (target: Function) => {
        const metadata = getMiddlewares(target)
        defineMetadata(CLASS_MIDDLEWAREKEY, [...middlewares, ...metadata], target);

        for (const middleware of middlewares) {
            if (typeof middleware.onDefineMiddlewareTo === 'function') {
                middleware.onDefineMiddlewareTo(target)
            }
        }
    }
}

export const getMiddlewares = (target) => {
    return getMetadata(CLASS_MIDDLEWAREKEY, target) || []
}
