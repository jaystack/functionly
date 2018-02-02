import { CLASS_HTTPTRIGGER } from '../../constants'
import { getMetadata, defineMetadata } from '../../metadata'
import { rest, CorsConfig } from '../rest'

export const defaultEndpoint = {
    methods: ['get'],
    cors: true,
    authLevel: 'anonymous'
}

export const httpTrigger = (endpoint: {
    route: string,
    methods?: string[],
    cors?: boolean,
    corsConfig?: CorsConfig,
    authLevel?: 'anonymous' | 'function' | 'admin'
}) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_HTTPTRIGGER, target) || []
        metadata.push({ ...defaultEndpoint, ...endpoint })
        defineMetadata(CLASS_HTTPTRIGGER, [...metadata], target);
    }
}

rest.extension('azure', (target, config) => {
    const decorator = httpTrigger({
        route: config.path,
        methods: config.methods,
        cors: config.cors,
        corsConfig: config.corsConfig,
        authLevel: config.authenticated ? 'function' : 'anonymous'
    })
    decorator(target)
})