export { Service, FunctionalApi, FunctionalService, DynamoDB, SimpleNotificationService, S3Storage, callExtension } from './classes'
export { addProvider, removeProvider, Provider, AWSProvider, LocalProvider, DeployProvider } from './providers'
import * as _annotations from './annotations'
export const annotations = _annotations
