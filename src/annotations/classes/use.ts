import { CLASS_MIDDLEWAREKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { createClassDecorator, ArrayDecorator } from '../decorators'

// export const use = (...middlewares) => {
//     return (target: Function) => {
//         const metadata = getMiddlewares(target)
//         defineMetadata(CLASS_MIDDLEWAREKEY, [...middlewares, ...metadata], target);

//         for (const middleware of middlewares) {
//             if (typeof middleware.onDefineMiddlewareTo === 'function') {
//                 middleware.onDefineMiddlewareTo(target)
//             }
//         }
//     }
// }

export type MiddlewareProps = any[]
export class MiddlewareDecorator extends ArrayDecorator<MiddlewareProps>{
    public decorator(value, metadata, target) {
        for (const middleware of value) {
            if (typeof middleware.onDefineMiddlewareTo === 'function') {
                middleware.onDefineMiddlewareTo(target)
            }
        }
        return [...value, ...metadata]
    }
}
export const use = createClassDecorator<MiddlewareProps>(new MiddlewareDecorator())


export const getMiddlewares = (target) => {
    return use.value(target)
    // return getMetadata(CLASS_MIDDLEWAREKEY, target) || []
}
