import { expandableDecorator } from './expandableDecorator'
import { createExpandableClassDecorator, ObjectDecorator } from '../decorators'

// export const rest = expandableDecorator<{ path: string, methods?: string[], cors?: boolean, anonymous?: boolean }>({
//     name: 'rest',
//     defaultValues: {
//         methods: ['get'],
//         cors: false,
//         anonymous: false
//     }
// })

export type RestProps = { path: string, methods?: string[], cors?: boolean, anonymous?: boolean }
export class RestDecorator extends ObjectDecorator<RestProps>{
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.rest = serviceDefinition.rest || []
        serviceDefinition.rest.push(value)
    }
}

const _restDecorator = createExpandableClassDecorator<RestProps>(new RestDecorator({
    methods: ['get'],
    cors: false,
    anonymous: false
}))
export const rest = Object.assign((options: RestProps) => _restDecorator(options), _restDecorator)

export interface IHttpMethod {
    (path: string): Function
    (config: { path: string, cors?: boolean, anonymous?: boolean }): Function
}

export const resolveParam = (p: any, defaults) => {
    if (typeof p === 'string') {
        return { ...defaults, path: p }
    } else {
        return { ...defaults, ...p }
    }
}


export const httpGet: IHttpMethod = (p) => rest(resolveParam(p, { methods: ['get'] }))
export const httpPost: IHttpMethod = (p) => rest(resolveParam(p, { methods: ['post'] }))
export const httpPut: IHttpMethod = (p) => rest(resolveParam(p, { methods: ['put'] }))
export const httpPatch: IHttpMethod = (p) => rest(resolveParam(p, { methods: ['patch'] }))
export const httpDelete: IHttpMethod = (p) => rest(resolveParam(p, { methods: ['delete'] }))
