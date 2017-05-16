export * from './classes/injectable'
export * from './classes/http'
export * from './classes/handler'
export * from './classes/environment'
export * from './classes/tag'
export * from './classes/resource'

import { simpleClassAnnotation } from './classes/simpleAnnotation'

import { Class_DescriptionKey, Class_RoleKey, Class_RuntimeKey } from './constants'
export const description = simpleClassAnnotation<string>(Class_DescriptionKey)
export const role = simpleClassAnnotation<string>(Class_RoleKey)
export const runtime = simpleClassAnnotation<string>(Class_RuntimeKey)


export * from './parameters/param'
export * from './parameters/inject'

import * as _constants from './constants'
export const constants = _constants

export * from './metadata'