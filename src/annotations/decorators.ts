
import { getMetadata, getOwnMetadata, defineMetadata, getMetadataKeys } from './metadata'


export type ClassDecorator<P> = {
    (target: Function): void,
    value: (target: Function) => P,
    ownValue: (target: Function) => P
}

export type PropertyDecorator<P> = {
    (target, targetKey, parameterIndex): void,
    value: (target: Function) => P,
    ownValue: (target: Function) => P
}

export type Decorator<P, R> = R & {
    value: (target: Function) => P,
    ownValue: (target: Function) => P
}

export type ExpandableDecorator<P, R> = R & {
    value: (target: Function) => P,
    ownValue: (target: Function) => P,
    extension: (environmentMode: string, handler: (target, config) => void) => void,
    environmentKey: string
}

// export const createDecorator2 = function <P, T>(decoratorClass: P) {
//     return Object.assign({}) as Decorator2<P, T>
// }

// export type myDParams = { url: string }
// const myd = createDecorator2<myDParams, (options?: myDParams) => ClassDecorator<myDParams>>(null)

// const myd2 = createDecorator2<myDParams, (options?: myDParams) => PropertyDecorator<myDParams>>(null)
















export class Metadata {
    public static registerDecorator(decorator) {
        defineMetadata(decorator.getKey(), decorator, this)
    }

    private metadata = {
        services: []
    }
    public addService(serviceInfo) {
        const { service } = serviceInfo
        const serviceDefinition = {
            name: service.name,
            ...serviceInfo
        }
        this.metadata.services.push(serviceDefinition)

        const metadataKeys = getMetadataKeys(service)
        for (const { key, decorator } of this.getMetadataTransformers()) {
            if (metadataKeys.indexOf(key) >= 0) {
                const value = getMetadata(key, service)
                decorator.metadata({
                    value,
                    serviceDefinition,
                    metadata: this.metadata
                })
            }
        }
    }

    public applyToAllService(func: (classDefinition, metadata) => void) {
        for (const service of this.metadata.services) {
            func(service, this.metadata)
        }
    }

    public toJson() {
        return this.metadata
    }

    private getMetadataTransformers() {
        const keys = getMetadataKeys(this) || []
        return keys.map((key) => ({
            key,
            decorator: getMetadata(key, this)
        }))
    }
}

// export const decoratorValueHandlers = {
//     Object: ({ environmentKey, target, decorator, defaultValue, options }) => {
//         const metadata = getMetadata(environmentKey, target) || {}
//         const newMetadata = decorator(Object.assign({}, defaultValue, options), metadata)
//         if (newMetadata === metadata) return
//         defineMetadata(environmentKey, newMetadata, target)
//     },
//     Array: ({ environmentKey, target, decorator, defaultValue, options }) => {
//         const metadata = getMetadata(environmentKey, target) || []
//         const newMetadata = decorator([...(options || [])], metadata)
//         if (newMetadata === metadata) return
//         defineMetadata(environmentKey, newMetadata, target)
//     },
//     Primitiv: ({ environmentKey, target, decorator, defaultValue, options }) =>
//         defineMetadata(environmentKey, options, target)
// }

// export const classDecorator = function <T>({ mode, name, defaultValue, decorator, ownDecorator, metadata }: {
//     mode?: keyof typeof decoratorValueHandlers
//     name?: string,
//     defaultValue?: T,
//     decorator?: (p: Partial<T>, oldMetadata: any) => any,
//     ownDecorator?: (p: Partial<T>) => any,
//     metadata?: (value, classDefinition, metadata) => void,
// }) {
//     mode = mode || 'Object'
//     const environmentKey = 'functionly:decorator:' + (name || Math.random()).toString().toUpperCase()
//     Metadata.registerMetadata(environmentKey, metadata)

//     return (p?: Partial<T>/* | Function*/) => {
//         const _decorator = (options: T) => (target: Function) => {
//             const valueHandler = decoratorValueHandlers[mode]
//             valueHandler({ environmentKey, target, decorator, defaultValue, options })
//         }

//         // return typeof p === 'function' ?
//         //     _decorator(Object.assign({}, defaultValue))(p) :
//         //     _decorator(Object.assign({}, defaultValue, p))
//         return _decorator(Object.assign({}, defaultValue, p))
//     }
// }

//////////////////////////////////////////////////////////////////////////////


export abstract class DecoratorClass<T> {
    protected defaultValue: Partial<T>
    protected decoratorKey: string

    constructor(_default?: Partial<T>) {
        this.defaultValue = _default
        this.decoratorKey = 'functionly:decorator:' + Math.random().toString().toUpperCase()
    }
    public decorator(...params) { }
    public metadata({ value, serviceDefinition, metadata }) { }

    public implementation(value, target) {
        const metadata = this.getValue(target)
        const newMetadata = this.decorator(this.applyDefaultValue(value), metadata, target)
        return this.setValue(newMetadata, target)
    }
    public getKey() { return this.decoratorKey }
    public getValue(target) { return getMetadata(this.decoratorKey, target) }
    public getOwnValue(target) { return getOwnMetadata(this.decoratorKey, target) }
    public setValue(value, target) {
        const metadata = this.getValue(target)
        if (value === metadata) return
        defineMetadata(this.decoratorKey, value, target)
        return value
    }
    public applyDefaultValue(value) {
        return value || this.defaultValue
    }
}

export class ObjectDecorator<T> extends DecoratorClass<T> {
    public decorator(value: T, metadata: T, target: Function): { [key: string]: any } { return Object.assign({}, metadata, value) }
    public getValue(target) { return super.getValue(target) || {} }
    public applyDefaultValue(value) {
        return Object.assign({}, this.defaultValue, value)
    }
}

export class ArrayDecorator<T> extends DecoratorClass<T> {
    public decorator(value: T, metadata: T[], target: Function): any[] { return [value, ...metadata] }
    public getValue(target) { return super.getValue(target) || [] }
}

export class PrimitiveDecorator<T> extends DecoratorClass<T> {
    public decorator(value: T, metadata: T, target: Function): T { return value }
}


export const createClassDecorator = function <T>(decorator: DecoratorClass<T>) {
    Metadata.registerDecorator(decorator)

    return Object.assign(
        (options?: T) => {
            return (target) => {
                decorator.implementation(options, target)
            }
        }, {
            value(target: Function) {
                return decorator.getValue(target)
            },
            ownValue(target: Function) {
                return decorator.getOwnValue(target)
            }
        }
    )
}

export const createExpandableClassDecorator = function <T>(decorator: DecoratorClass<T>) {
    Metadata.registerDecorator(decorator)

    const environmentKey = decorator.getKey()
    const environmentDecorators = new Map<string, ((target, config) => void)[]>()

    return Object.assign(
        (options?: T) => {
            return (target) => {
                const environment = process.env.FUNCTIONAL_ENVIRONMENT
                if (environment && environmentDecorators.has(environment)) {
                    const handlers = environmentDecorators.get(environment)
                    for (const handler of handlers) {
                        handler(target, decorator.applyDefaultValue(options))
                    }
                } else {
                    decorator.implementation(options, target)
                }
            }
        },
        {
            extension: (environmentMode: string, handler: (target, config) => void) => {
                const handlers = environmentDecorators.get(environmentMode) || []
                environmentDecorators.set(environmentMode, [...handlers, handler])
            },
            environmentKey,
            value(target: Function) {
                return decorator.getValue(target)
            },
            ownValue(target: Function) {
                return decorator.getOwnValue(target)
            }
        }
    )
}

export const requiredParameter = function <T>(func) {
    return Object.assign(
        (options: T): (target: Function) => void => {
            return func(options)
        },
        func
    ) as (options: T) => (target: Function) => void
}

export const applyParameter = function <T>(func, value) {
    const result = func(value)
    return Object.assign(
        result,
        func
    ) as {
            (target): void,
            [key: string]: any
        }
}




export class ArrayPropertyDecorator<T> extends DecoratorClass<T> {
    public decorator(value: T, metadata: T[], target: Function, targetKey: string, propertyIndex: number): any[] { return [value, ...metadata] }
    public getValue(target) { return super.getValue(target) || [] }
}

export class PrimitivePropertyDecorator<T> extends DecoratorClass<T> {
    public decorator(value: T, metadata: T, target: Function, targetKey: string, propertyIndex: number): T { return value }
}

export const applyPropertyParameter = function <T>(func, value) {
    const result = func(value)
    return Object.assign(
        result,
        func
    ) as {
            (target, targetKey, index): void,
            [key: string]: any
        }
}