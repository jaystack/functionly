import { defineMetadata, getMetadata, constants } from '../annotations'
const { CLASS_ENVIRONMENTKEY } = constants

export class Resource {
    public constructor(...params) { }
    public static factory(...params) { return new this(...params) }

    public static onDefineInjectTo(target, targetKey, parameterIndex: number) {
        const metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}
        const injectMetadata = getMetadata(CLASS_ENVIRONMENTKEY, this) || {}
        if (injectMetadata) {
            Object.keys(injectMetadata).forEach((key) => {
                metadata[key] = injectMetadata[key]
            })
            defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
        }
    }
}