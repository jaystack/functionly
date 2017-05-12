import { Class_EnvironmentKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const environment = (key: string, value: string) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_EnvironmentKey, target) || {}
        metadata[key] = value
        defineMetadata(Class_EnvironmentKey, {...metadata}, target);
    }
}