import { Class_InjectableKey } from '../constants'
import { defineMetadata } from '../metadata'

export const injectable = (target: Function) => {
    defineMetadata(Class_InjectableKey, true, target);
}
