import { CLASS_MIDDLEWAREKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'

export const use = (...middleware) => {
    return (target: Function) => {
        const metadata = getMiddlewares(target)
        defineMetadata(CLASS_MIDDLEWAREKEY, [...middleware, ...metadata], target);

        for (const mw of middleware) {
            if (typeof mw.onDefineMiddlewareTo === 'function') {
                mw.onDefineMiddlewareTo(target)
            }
        }
    }
}

export const getMiddlewares = (target) => {
    return getMetadata(CLASS_MIDDLEWAREKEY, target) || []
}
