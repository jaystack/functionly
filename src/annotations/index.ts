export { injectable } from './classes/injectable'
export { apiGateway } from './classes/apiGateway'
export { environment, environmentTemplates } from './classes/environment'
export { tag } from './classes/tag'
export { log } from './classes/log'
export { runtime } from './classes/runtime'
export { functionName, getFunctionName } from './classes/functionName'

import { simpleClassAnnotation } from './classes/simpleAnnotation'

import { Class_DescriptionKey, Class_RoleKey, Class_RuntimeKey } from './constants'
export const description = simpleClassAnnotation<string>(Class_DescriptionKey)
export const role = simpleClassAnnotation<string>(Class_RoleKey)


export { param } from './parameters/param'
export { inject } from './parameters/inject'

import * as _constants from './constants'
export const constants = _constants

export { defineMetadata, getMetadata, getMetadataKeys, getOwnMetadata } from './metadata'