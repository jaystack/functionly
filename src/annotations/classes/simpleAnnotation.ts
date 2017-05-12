import { defineMetadata } from '../metadata'

export const simpleClassAnnotation = function <T>(property) {
    return (value: T) => {
        return (target: Function) => {
            defineMetadata(property, value, target);
        }
    }
}
