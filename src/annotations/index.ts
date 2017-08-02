export { templates, applyTemplates } from './templates'
export { injectable } from './classes/injectable'
export { apiGateway } from './classes/aws/apiGateway'
export { httpTrigger } from './classes/azure/httpTrigger'
export { rest, httpGet, httpPost, httpPut, httpPatch, httpDelete, IHttpMethod } from './classes/rest'
export { environment } from './classes/environment'
export { tag } from './classes/tag'
export { log } from './classes/log'
export { functionName, getFunctionName } from './classes/functionName'
export { dynamoTable, __dynamoDBDefaults } from './classes/dynamoTable'
export { sns } from './classes/sns'
export { s3Storage } from './classes/s3Storage'
export { eventSource } from './classes/eventSource'
export { classConfig, getClassConfigValue } from './classes/classConfig'
export { simpleClassAnnotation } from './classes/simpleAnnotation'
export { expandableDecorator } from './classes/expandableDecorator'
export { use } from './classes/use'

import { simpleClassAnnotation } from './classes/simpleAnnotation'

import { CLASS_DESCRIPTIONKEY, CLASS_ROLEKEY } from './constants'
export const description = simpleClassAnnotation<string>(CLASS_DESCRIPTIONKEY)
export const role = simpleClassAnnotation<string>(CLASS_ROLEKEY)

export { aws } from './classes/aws/aws'

export { azure } from './classes/azure/azure'

export { param, serviceParams, createParameterDecorator, request, context, error, functionalServiceName } from './parameters/param'
export { inject } from './parameters/inject'

import * as _constants from './constants'
export const constants = _constants

export { defineMetadata, getMetadata, getMetadataKeys, getOwnMetadata, getOverridableMetadata } from './metadata'