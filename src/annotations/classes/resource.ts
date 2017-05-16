import { environment } from './environment'
import { Class_EnvironmentKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const resource = (resource) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_EnvironmentKey, target) || {}

        let resourceMetadata = getMetadata(Class_EnvironmentKey, resource) || {}
        if(resourceMetadata){
            Object.keys(resourceMetadata).forEach((key) => {
                metadata[key] = resourceMetadata[key]
            })
        }

        defineMetadata(Class_EnvironmentKey, { ...metadata }, target);
    }
}
