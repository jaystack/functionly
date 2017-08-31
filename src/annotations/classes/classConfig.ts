import { CLASS_CLASSCONFIGKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { createClassDecorator, ObjectDecorator } from '../decorators'

// export const classConfig = (config: { [key: string]: any }) => {
//     return (target: Function) => {
//         let metadata = getMetadata(CLASS_CLASSCONFIGKEY, target) || {}
//         defineMetadata(CLASS_CLASSCONFIGKEY, { ...metadata, ...config }, target);
//     }
// }

// export const getClassConfigValue = (key: string, target) => {
//     return (getMetadata(CLASS_CLASSCONFIGKEY, target) || {})[key]
// }

export type ClassConfigProps = { [key: string]: any }
const classConfigDecorator = new ObjectDecorator<ClassConfigProps>()

export const getClassConfigValue = (key: string, target) => {
    return (getMetadata(classConfigDecorator.getKey(), target) || {})[key]
}

export const classConfig = createClassDecorator<ClassConfigProps>(classConfigDecorator)
