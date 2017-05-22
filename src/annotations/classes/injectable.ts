import { CLASS_INJECTABLEKEY } from '../constants'
import { defineMetadata } from '../metadata'

export const injectable = (target: Function) => {
    defineMetadata(CLASS_INJECTABLEKEY, true, target);
}
