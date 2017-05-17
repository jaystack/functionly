import { Class_ApiGatewayKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { defaults } from 'lodash'

export const defaultEndpoint = {
    method: 'get',
    cors: false
}

export const apiGateway = (endpoint: { path: string, method?: string, cors?: boolean }) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_ApiGatewayKey, target) || []
        metadata.push(defaults({}, endpoint, defaultEndpoint))
        defineMetadata(Class_ApiGatewayKey, [...metadata], target);
    }
}
