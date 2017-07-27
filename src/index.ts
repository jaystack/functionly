export { Service, FunctionalApi, FunctionalService, DynamoDB, SimpleNotificationService, S3Storage, ApiGateway, callExtension, PreHook, PostHook } from './classes'
export { addProvider, removeProvider, Provider, AWSProvider, LocalProvider } from './providers'
import * as _annotations from './annotations'
export const annotations = _annotations


export { IHttpMethod } from './annotations'
