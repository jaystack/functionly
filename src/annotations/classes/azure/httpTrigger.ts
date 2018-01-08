import { CLASS_HTTPTRIGGER } from '../../constants'
import { getMetadata, defineMetadata } from '../../metadata'
import { rest } from '../rest'

export const defaultEndpoint = {
    methods: ['get'],
    cors: false,
    authLevel: 'function'
}

export const httpTrigger = (endpoint: {
    route: string,
    methods?: string[],
    cors?: boolean,
    corsConfig?: { headers: string[] },
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
        authLevel: config.anonymous ? 'anonymous' : 'function'
    })
    decorator(target)
})