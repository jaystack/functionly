import { CLASS_APIGATEWAYKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { defaults } from 'lodash'

export const defaultEndpoint = {
    method: 'get',
    cors: false
}

export const apiGateway = (endpoint: { path: string, method?: string, cors?: boolean }) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_APIGATEWAYKEY, target) || []
        metadata.push(defaults({}, endpoint, defaultEndpoint))
        defineMetadata(CLASS_APIGATEWAYKEY, [...metadata], target);
    }
}
