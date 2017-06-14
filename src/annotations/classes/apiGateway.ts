import { CLASS_APIGATEWAYKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { defaults } from 'lodash'

export const defaultEndpoint = {
    method: 'get',
    cors: false,
    authorization: 'AWS_IAM'
}

export const apiGateway = (endpoint: { path: string, method?: string, cors?: boolean, 
        authorization?: 'AWS_IAM' | 'NONE' | 'CUSTOM' | 'COGNITO_USER_POOLS' }) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_APIGATEWAYKEY, target) || []
        metadata.push(defaults({}, endpoint, defaultEndpoint))
        defineMetadata(CLASS_APIGATEWAYKEY, [...metadata], target);
    }
}
