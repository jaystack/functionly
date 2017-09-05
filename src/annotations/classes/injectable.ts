import { CLASS_INJECTABLEKEY } from '../constants'
import { defineMetadata } from '../metadata'

export enum InjectionScope {
    Transient = 1,
    Singleton = 2
}

export const injectable = (scope: InjectionScope = InjectionScope.Transient) => {
    return (target) => {
        defineMetadata(CLASS_INJECTABLEKEY, scope, target);
    }
}
