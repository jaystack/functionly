import { getMetadata, constants } from '../../../../annotations'
const { CLASS_APIGATEWAYKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'

export const API_GATEWAY_REST_API = 'ApiGatewayRestApi'

export const apiGateway = ExecuteStep.register('ApiGateway', async (context) => {
    const deploymentResources = []
    await executor({ ...context, deploymentResources }, gatewayRestApi)
    await executor({ ...context, deploymentResources }, gatewayResources)
    await executor({ ...context, deploymentResources }, gatewayDeployment)
})

export const gatewayRestApi = ExecuteStep.register('ApiGateway-RestApi', async (context) => {
    const RestApi = {
        "Type": "AWS::ApiGateway::RestApi",
        "Properties": {
            "Name": context.CloudFormationConfig.StackName
        }
    }

    const apiName = setResource(context, API_GATEWAY_REST_API, RestApi)

    context.CloudFormationTemplate.Outputs[`ServiceEndpoint`] = {
        "Value": {
            "Fn::Join": [
                "",
                [
                    "https://",
                    {
                        "Ref": apiName
                    },
                    ".execute-api.eu-central-1.amazonaws.com/dev"
                ]
            ]
        }
    }

})

export const gatewayResources = ExecuteStep.register('ApiGateway-Resources', async (context) => {
    const endpointsCors = new Map<string, string[]>()
    const endpoints = new Map<string, any>()
    for (const serviceDefinition of context.publishedFunctions) {
        await executor({
            context: { ...context, serviceDefinition, endpointsCors, endpoints },
            name: `ApiGateway-Methods-${serviceDefinition.service.name}`,
            method: apiGatewayMethods
        })
    }

    for (const [endpointResourceName, methods] of endpointsCors) {
        await executor({
            context: { ...context, endpointResourceName, methods },
            name: `ApiGateway-Method-Options-${endpointResourceName}`,
            method: setOptionsMethodResource
        })
    }
})

export const apiGatewayMethods = async (context) => {
    const { serviceDefinition, endpoints, endpointsCors } = context

    let httpMetadata = getMetadata(CLASS_APIGATEWAYKEY, serviceDefinition.service) || []
    for (let metadata of httpMetadata) {
        await executor({
            context: { ...context, ...metadata },
            name: `ApiGateway-Method-${metadata.method}-${metadata.path}`,
            method: apiGatewayMethod
        })
    }
}

export const apiGatewayMethod = async (context) => {
    const { path, cors, authorization, endpoints, endpointsCors, serviceDefinition } = context
    const method = context.method.toUpperCase()

    const pathParts = path.split('/')
    let pathFragment = ''
    let endpointResourceName;
    for (const pathPart of pathParts) {
        if (!pathPart) continue

        const rootPathFragment = pathFragment
        pathFragment += `/${pathPart}`

        if (endpoints.has(pathFragment)) {
            endpointResourceName = endpoints.get(pathFragment)
        } else {
            endpointResourceName = await executor({
                context: { ...context, pathFragment, rootPathFragment, endpoints, pathPart },
                name: `ApiGateway-ResourcePath-${pathFragment}`,
                method: apiGatewayPathPart
            })
        }
    }

    if (cors) {
        let values = ['OPTIONS']
        if (endpointsCors.has(endpointResourceName)) {
            values = endpointsCors.get(endpointResourceName)
        }
        values.push(method)
        endpointsCors.set(endpointResourceName, values)
    }

    const properties = {
        "HttpMethod": method,
        "RequestParameters": {},
        "ResourceId": {
            "Ref": endpointResourceName
        },
        "RestApiId": {
            "Ref": API_GATEWAY_REST_API
        },
        "AuthorizationType": authorization,
        "Integration": {
            "IntegrationHttpMethod": "POST",
            "Type": "AWS_PROXY",
            "Uri": {
                "Fn::Join": [
                    "",
                    [
                        "arn:aws:apigateway:",
                        {
                            "Ref": "AWS::Region"
                        },
                        ":lambda:path/2015-03-31/functions/",
                        {
                            "Fn::GetAtt": [
                                serviceDefinition.resourceName,
                                "Arn"
                            ]
                        },
                        "/invocations"
                    ]
                ]
            }
        },
        "MethodResponses": []
    }

    const methodConfig = {
        "Type": "AWS::ApiGateway::Method",
        "Properties": properties
    }
    const resourceName = `ApiGateway${pathFragment}${method}`
    const name = setResource(context, resourceName, methodConfig)

    await executor({
        context,
        name: `ApiGateway-Method-Permission-${pathFragment}`,
        method: setGatewayPermissions
    })
}

export const apiGatewayPathPart = async (context) => {
    const { pathFragment, rootPathFragment, endpoints, pathPart } = context

    const properties = {
        "ParentId": getAGResourceParentId(rootPathFragment, endpoints),
        "PathPart": pathPart,
        "RestApiId": {
            "Ref": API_GATEWAY_REST_API
        }
    }

    const resourceConfig = {
        "Type": "AWS::ApiGateway::Resource",
        "Properties": properties
    }
    const resourceName = `ApiGateway${pathFragment}`
    const endpointResourceName = setResource(context, resourceName, resourceConfig)
    endpoints.set(pathFragment, endpointResourceName)
    return endpointResourceName
}

export const gatewayDeployment = ExecuteStep.register('ApiGateway-Deployment', async (context) => {

    const deploymentResources = context.deploymentResources
        .filter(r => r.type === 'AWS::ApiGateway::Method')
        .map(r => r.name)

    const ApiGatewayDeployment = {
        "Type": "AWS::ApiGateway::Deployment",
        "Properties": {
            "RestApiId": {
                "Ref": API_GATEWAY_REST_API
            },
            "StageName": "dev"
        },
        "DependsOn": [
            ...deploymentResources
        ]
    }

    const resourceName = `ApiGateway${context.date.valueOf()}`
    const apiName = setResource(context, resourceName, ApiGatewayDeployment)

})

export const getAGResourceParentId = (rootPathFragment, endpoints) => {
    if (rootPathFragment && endpoints.has(rootPathFragment)) {
        return {
            "Ref": endpoints.get(rootPathFragment)
        }
    } else {
        return {
            "Fn::GetAtt": [
                API_GATEWAY_REST_API,
                "RootResourceId"
            ]
        }
    }
}

export const setOptionsMethodResource = (context) => {
    const { endpointResourceName, methods } = context
    const properties = {
        "AuthorizationType": "NONE",
        "HttpMethod": "OPTIONS",
        "MethodResponses": [
            {
                "StatusCode": "200",
                "ResponseParameters": {
                    "method.response.header.Access-Control-Allow-Origin": true,
                    "method.response.header.Access-Control-Allow-Headers": true,
                    "method.response.header.Access-Control-Allow-Methods": true,
                    "method.response.header.Access-Control-Allow-Credentials": true
                },
                "ResponseModels": {}
            }
        ],
        "RequestParameters": {},
        "Integration": {
            "Type": "MOCK",
            "RequestTemplates": {
                "application/json": "{statusCode:200}"
            },
            "IntegrationResponses": [
                {
                    "StatusCode": "200",
                    "ResponseParameters": {
                        "method.response.header.Access-Control-Allow-Origin": "'*'",
                        "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization,X-Requested-With'",
                        "method.response.header.Access-Control-Allow-Methods": `'${methods.join(',')}'`,
                        "method.response.header.Access-Control-Allow-Credentials": "'true'"
                    },
                    "ResponseTemplates": {
                        "application/json": ""
                    }
                }
            ]
        },
        "ResourceId": {
            "Ref": endpointResourceName
        },
        "RestApiId": {
            "Ref": API_GATEWAY_REST_API
        }
    }

    const methodConfig = {
        "Type": "AWS::ApiGateway::Method",
        "Properties": properties
    }
    const resourceName = `${endpointResourceName}Options`
    setResource(context, resourceName, methodConfig)
}

export const setGatewayPermissions = (context) => {
    const { serviceDefinition } = context
    const properties = {
        "FunctionName": {
            "Fn::GetAtt": [
                serviceDefinition.resourceName,
                "Arn"
            ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
            "Fn::Join": [
                "",
                [
                    "arn:aws:execute-api:",
                    {
                        "Ref": "AWS::Region"
                    },
                    ":",
                    {
                        "Ref": "AWS::AccountId"
                    },
                    ":",
                    {
                        "Ref": API_GATEWAY_REST_API
                    },
                    "/*/*"
                ]
            ]
        }
    }

    const methodConfig = {
        "Type": "AWS::Lambda::Permission",
        "Properties": properties
    }
    const resourceName = `ApiGateway${serviceDefinition.resourceName}Permission`
    setResource(context, resourceName, methodConfig, true)
}
