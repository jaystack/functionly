export { injectable } from './classes/injectable'
export { apiGateway } from './classes/apiGateway'
export { environment, environmentTemplates } from './classes/environment'
export { tag } from './classes/tag'
export { log } from './classes/log'
export { runtime } from './classes/runtime'
export { functionName, getFunctionName } from './classes/functionName'
export { dynamoTable, __dynamoDBDefaults } from './classes/dynamoTable'

import { simpleClassAnnotation } from './classes/simpleAnnotation'

import { CLASS_DESCRIPTIONKEY, CLASS_ROLEKEY, CLASS_RUNTIMEKEY } from './constants'
export const description = simpleClassAnnotation<string>(CLASS_DESCRIPTIONKEY)
export const role = simpleClassAnnotation<string>(CLASS_ROLEKEY)


export { param, event } from './parameters/param'
export { inject } from './parameters/inject'

import * as _constants from './constants'
export const constants = _constants

export { defineMetadata, getMetadata, getMetadataKeys, getOwnMetadata } from './metadata'