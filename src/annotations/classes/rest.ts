import { expandableDecorator } from './expandableDecorator'

export interface CorsConfig {
    headers?: string[],
    methods?: string[],
    origin?: string,
    credentials?: boolean
}

export const rest = expandableDecorator<{ path: string, methods?: string[], cors?: boolean, corsConfig?: CorsConfig, anonymous?: boolean }>({
    name: 'rest',
    defaultValues: {
        methods: ['get'],
        cors: false,
        anonymous: false
    }
})

export interface IHttpMethod {
    (path: string): Function
    (config: { path: string, cors?: boolean, corsConfig?: CorsConfig, anonymous?: boolean }): Function
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
