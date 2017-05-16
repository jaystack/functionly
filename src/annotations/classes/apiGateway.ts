import { Class_ApiGatewayKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const apiGateway = (endpoint: { path: string, method?: string, cors?: boolean }) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_ApiGatewayKey, target) || []
        metadata.push(endpoint)
        defineMetadata(Class_ApiGatewayKey, [...metadata], target);
    }
}
