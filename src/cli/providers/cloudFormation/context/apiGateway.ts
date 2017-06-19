import { getMetadata, constants } from '../../../../annotations'
const { CLASS_APIGATEWAYKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { setResource } from '../utils'
import { setStackParameter, getStackName } from './stack'

export const API_GATEWAY_REST_API = 'ApiGatewayRestApi'

export const apiGateway = ExecuteStep.register('ApiGateway', async (context) => {
    await executor(context, gatewayRestApi)
    await executor(context, gatewayResources)
    await executor(context, gatewayDeployment)
})

export const gatewayRestApi = ExecuteStep.register('ApiGateway-RestApi', async (context) => {
    const RestApi = {
        "Type": "AWS::ApiGateway::RestApi",
        "Properties": {
            "Name": context.CloudFormationConfig.StackName
        }
    }

    const resourceName = setResource(context, API_GATEWAY_REST_API, RestApi)

    await setStackParameter({
        ...context,
        resourceName
    })

    await setStackParameter({
        ...context,
        resourceName,
        attr: 'RootResourceId'
    })

    context.CloudFormationTemplate.Outputs[`ServiceEndpoint`] = {
        "Value": {
            "Fn::Join": [
                "",
                [
                    "https://",
                    {
                        "Ref": resourceName
                    },
                    ".execute-api.eu-central-1.amazonaws.com/dev"
                ]
            ]
        }
    }

})

export const gatewayResources = ExecuteStep.register('ApiGateway-Resources', async (context) => {
    const endpointsCors = new Map<string, any>()
    const endpoints = new Map<string, any>()
    for (const serviceDefinition of context.publishedFunctions) {
        await executor({
            context: { ...context, serviceDefinition, endpointsCors, endpoints },
            name: `ApiGateway-Methods-${serviceDefinition.service.name}`,
            method: apiGatewayMethods
        })
    }

    for (const [endpointResourceName, { serviceDefinition, methods }] of endpointsCors) {
        await executor({
            context: { ...context, endpointResourceName, serviceDefinition, methods },
            name: `ApiGateway-Method-Options-${endpointResourceName}`,
            method: setOptionsMethodResource
        })
    }
})

export const apiGatewayMethods = async (context) => {
    const { serviceDefinition } = context

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
    let endpoint;
    for (const pathPart of pathParts) {
        if (!pathPart) continue

        const rootPathFragment = pathFragment
        pathFragment += `/${pathPart}`

        if (endpoints.has(pathFragment)) {
            endpoint = endpoints.get(pathFragment)
        } else {
            endpoint = await executor({
                context: { ...context, pathFragment, rootPathFragment, endpoints, pathPart },
                name: `ApiGateway-ResourcePath-${pathFragment}`,
                method: apiGatewayPathPart
            })
        }
    }

    if (!endpoint) {
        //  handle / (root path)
        throw new Error('TODO missing endpoint')
    }

    if (endpoint.serviceDefinition !== serviceDefinition) {
        await setStackParameter({
            ...context,
            resourceName: endpoint.endpointResourceName,
            sourceStackName: getStackName(endpoint.serviceDefinition),
            targetStackName: getStackName(serviceDefinition)
        })
    }

    if (cors) {
        let value = {
            serviceDefinition,
            methods: ['OPTIONS']
        }
        if (endpointsCors.has(endpoint.endpointResourceName)) {
            value = endpointsCors.get(endpoint.endpointResourceName)
        }
        value.methods.push(method)
        endpointsCors.set(endpoint.endpointResourceName, value)
    }

    const properties = {
        "HttpMethod": method,
        "RequestParameters": {},
        "ResourceId": {
            "Ref": endpoint.endpointResourceName
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
    const name = setResource(context, resourceName, methodConfig, getStackName(serviceDefinition))

    await executor({
        context,
        name: `ApiGateway-Method-Permission-${pathFragment}`,
        method: setGatewayPermissions
    })
}

export const apiGatewayPathPart = async (context) => {
    const { pathFragment, rootPathFragment, endpoints, pathPart, serviceDefinition } = context

    let parentId
    if (rootPathFragment && endpoints.has(rootPathFragment)) {
        const endpoint = endpoints.get(rootPathFragment)
        if (endpoint.serviceDefinition !== serviceDefinition) {
            await setStackParameter({
                ...context,
                resourceName: endpoint.endpointResourceName,
                sourceStackName: getStackName(endpoint.serviceDefinition),
                targetStackName: getStackName(serviceDefinition)
            })
        }

        parentId = {
            "Ref": endpoint.endpointResourceName
        }
    } else {
        parentId = {
            "Ref": `${API_GATEWAY_REST_API}RootResourceId`
        }
    }

    const properties = {
        "ParentId": parentId,
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
    const endpointResourceName = setResource(context, resourceName, resourceConfig, getStackName(serviceDefinition))
    endpoints.set(pathFragment, { endpointResourceName, serviceDefinition })
    return { endpointResourceName, serviceDefinition }
}

export const gatewayDeployment = ExecuteStep.register('ApiGateway-Deployment', async (context) => {

    const lambdaDependsOn = context.deploymentResources
        .filter(r => !r.stackName && r.type === 'AWS::ApiGateway::Method')
        .map(r => r.resourceName)

    const stackDependsOn = context.deploymentResources
        .filter(r => r.stackName && r.type === 'AWS::ApiGateway::Method')
        .map(r => r.stackName)

    const ApiGatewayDeployment = {
        "Type": "AWS::ApiGateway::Deployment",
        "Properties": {
            "RestApiId": {
                "Ref": API_GATEWAY_REST_API
            },
            "StageName": "dev"
        },
        "DependsOn": [
            ...[...lambdaDependsOn, ...stackDependsOn].filter((v, i, self) => self.indexOf(v) === i)
        ]
    }

    const deploymentResourceName = `ApiGateway${context.date.valueOf()}`
    const resourceName = setResource(context, deploymentResourceName, ApiGatewayDeployment)

    // await setStackParameter({
    //     ...context,
    //     resourceName
    // })
})

export const setOptionsMethodResource = async (context) => {
    const { endpointResourceName, serviceDefinition, methods } = context
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
    setResource(context, resourceName, methodConfig, getStackName(serviceDefinition))
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
    setResource(context, resourceName, methodConfig, getStackName(serviceDefinition), true)
}
