import { Class_HttpKey } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'

export const http = (path: string, method?: string, cors?: boolean) => {
    return (target: Function) => {
        let metadata = getMetadata(Class_HttpKey, target) || []
        metadata.push({
            path,
            method,
            cors
        })
        defineMetadata(Class_HttpKey, [...metadata], target);
    }
}
