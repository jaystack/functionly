import { CLASS_HTTPTRIGGER } from '../../constants'
import { getMetadata, defineMetadata } from '../../metadata'
import { createClassDecorator, ObjectDecorator } from '../../decorators'
import { rest } from '../rest'

// export const httpTrigger = (endpoint: {
//     route: string,
//     methods?: string[],
//     cors?: boolean,
//     authLevel?: 'anonymous' | 'function' | 'admin'
// }) => {
//     return (target: Function) => {
//         let metadata = getMetadata(CLASS_HTTPTRIGGER, target) || []
//         metadata.push({ ...defaultEndpoint, ...endpoint })
//         defineMetadata(CLASS_HTTPTRIGGER, [...metadata], target);
//     }
// }


export type HttpTriggerProps = {
    route: string,
    methods?: string[],
    cors?: boolean,
    authLevel?: 'anonymous' | 'function' | 'admin'
}
export class HttpTriggerDecorator extends ObjectDecorator<HttpTriggerProps>{
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.httpTrigger = serviceDefinition.httpTrigger || []
        serviceDefinition.httpTrigger.push(value)
    }
}
const _httpTrigger = createClassDecorator<HttpTriggerProps>(new HttpTriggerDecorator({
    methods: ['get'],
    cors: false,
    authLevel: 'function'
}))
export const httpTrigger = (options: HttpTriggerProps) => _httpTrigger(options)


rest.extension('azure', (target, config) => {
    const decorator = httpTrigger({
        route: config.path,
        methods: config.methods,
        cors: config.cors,
        authLevel: config.anonymous ? 'anonymous' : 'function'
    })
    decorator(target)
})