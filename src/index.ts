
/* Classes */
export { FunctionalService, Api, Service, PreHook, PostHook, Resource } from './classes'

/* Apis */
export { DynamoTable, DocumentClientApi, SimpleNotificationService, SNSApi, S3Storage, S3Api, ApiGateway, CloudWatchEvent } from './classes'
export { MongoCollection, MongoConnection } from './plugins/mongo'

/* Hooks */
export { NoCallbackWaitsForEmptyEventLoop } from './plugins/mongo'

/* Providers */
export { Provider, AWSProvider, LocalProvider } from './providers'
export { addProvider, removeProvider } from './providers'

/* Decorators */
export {
    injectable, apiGateway, httpTrigger, rest, httpGet, httpPost, httpPut, httpPatch, httpDelete, IHttpMethod, environment,
    tag, log, functionName, dynamoTable, sns, s3Storage, eventSource, classConfig, use, description, role, group, aws, azure,
    param, serviceParams, request, error, result, functionalServiceName, provider, stage, inject, cloudWatchEvent, dynamo,
    cloudFormation
} from './annotations'
export { mongoCollection, mongoConnection } from './plugins/mongo'

/* Enums */
export { InjectionScope } from './annotations'

/* Helpers */
export { callExtension } from './classes'
export {
    templates, applyTemplates, getFunctionName, __dynamoDBDefaults, getClassConfigValue, simpleClassAnnotation, expandableDecorator,
    createParameterDecorator, constants, defineMetadata, getMetadata, getMetadataKeys, getOwnMetadata, getOverridableMetadata
} from './annotations'
 export { container, IOC } from './helpers/ioc'