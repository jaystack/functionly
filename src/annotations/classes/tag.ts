import { CLASS_TAGKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { createClassDecorator, ObjectDecorator } from '../decorators'

// export const tag = (key: string, value: string) => {
//     return (target: Function) => {
//         let metadata = getMetadata(CLASS_TAGKEY, target) || {}
//         metadata[key] = value
//         defineMetadata(CLASS_TAGKEY, {...metadata}, target);
//     }
// }

export type TagProps = { [key: string]: any }
export class TagDecorator extends ObjectDecorator<TagProps>{
    public decorator(value, metadata, target) {
        const oldValue = this.getValue(target)
        return { ...metadata, ...value }
    }
    public metadata({ value, serviceDefinition }) {
        const oldValue = this.getValue(serviceDefinition.service)
        serviceDefinition.tags = value
    }
}

const _tag = createClassDecorator<TagProps>(new TagDecorator())
export const tag = (key, value) => _tag({ [key]: value }) 
