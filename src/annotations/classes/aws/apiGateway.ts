import { CLASS_APIGATEWAYKEY } from '../../constants'
import { getMetadata, defineMetadata } from '../../metadata'
import { createClassDecorator, ObjectDecorator, requiredParameter } from '../../decorators'
import { rest } from '../rest'


// export const apiGateway = (endpoint: {
//     path: string, method?: string, cors?: boolean,
//     authorization?: 'AWS_IAM' | 'NONE' | 'CUSTOM' | 'COGNITO_USER_POOLS'
// }) => {
//     return (target: Function) => {
//         let metadata = getMetadata(CLASS_APIGATEWAYKEY, target) || []
//         metadata.push({ ...defaultEndpoint, ...endpoint })
//         defineMetadata(CLASS_APIGATEWAYKEY, [...metadata], target);
//     }
// }


export type ApiGatewayProps = {
    path: string, method?: string, cors?: boolean,
    authorization?: 'AWS_IAM' | 'NONE' | 'CUSTOM' | 'COGNITO_USER_POOLS'
}
export class ApiGatewayDecorator extends ObjectDecorator<ApiGatewayProps>{
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.apiGateways = serviceDefinition.apiGateways || []
        serviceDefinition.apiGateways.push(value)
    }
}
const _apiGateway = createClassDecorator<ApiGatewayProps>(new ApiGatewayDecorator({
    method: 'get',
    cors: false,
    authorization: 'AWS_IAM'
}))
export const apiGateway = (options: ApiGatewayProps) => _apiGateway(options)

rest.extension('aws', (target, config) => {
    for (const method of config.methods) {
        const decorator = apiGateway({
            path: config.path,
            method,
            cors: config.cors,
            authorization: config.anonymous ? 'NONE' : 'AWS_IAM'
        })
        decorator(target)
    }
})