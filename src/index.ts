export { Service, FunctionalApi, FunctionalService, DynamoDB, SimpleNotificationService, S3Storage, ApiGateway, callExtension } from './classes'
export { addProvider, removeProvider, Provider, AWSProvider, LocalProvider } from './providers'
import * as _annotations from './annotations'
export const annotations = _annotations
