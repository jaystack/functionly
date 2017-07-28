export { Service, FunctionalApi, FunctionalService, DynamoDB, SimpleNotificationService, S3Storage, ApiGateway, callExtension, PreHook, PostHook } from './classes'
export { addProvider, removeProvider, Provider, AWSProvider, LocalProvider } from './providers'

export {
    templates, applyTemplates,
    injectable,
    apiGateway,
    httpTrigger,
    rest, httpGet, httpPost, httpPut, httpPatch, httpDelete, IHttpMethod,
    environment,
    tag,
    log,
    functionName, getFunctionName,
    dynamoTable, __dynamoDBDefaults,
    sns,
    s3Storage,
    eventSource,
    classConfig, getClassConfigValue,
    simpleClassAnnotation,
    expandableDecorator,
    use,
    description,
    role,
    aws,
    azure,
    param, serviceParams, createParameterDecorator, request, context, error,
    inject,
    constants,
    defineMetadata, getMetadata, getMetadataKeys, getOwnMetadata, getOverridableMetadata
} from './annotations'
