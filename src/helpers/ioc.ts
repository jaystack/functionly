
import { getOwnMetadata } from '../annotations/metadata'
import { CLASS_INJECTABLEKEY } from '../annotations/constants'
import { InjectionScope } from '../annotations/classes/injectable'

export interface ClassFunction<T> {
    new(...args): T;
}

export class IOC {
    private instances: Map<ClassFunction<any>, any>
    public constructor() {
        this.instances = new Map<ClassFunction<any>, any>()
    }

    public register<T>(type: ClassFunction<T>, instance) {
        this.instances.set(type, instance)
    }
    public resolve<T>(type: ClassFunction<T>, ...params): T {
        const scope = getOwnMetadata(CLASS_INJECTABLEKEY, type) || InjectionScope.Transient
        switch (scope) {
            case InjectionScope.Singleton:
                if (!this.instances.has(type)) {
                    this.instances.set(type, new type(...params))
                }

                return this.instances.get(type)
            case InjectionScope.Transient:
            default:
                return new type(...params)
        }
    }
    public contains<T>(type: ClassFunction<T>): boolean {
        const scope = getOwnMetadata(CLASS_INJECTABLEKEY, type) || InjectionScope.Transient
        switch (scope) {
            case InjectionScope.Singleton:
                return this.instances.has(type)
            case InjectionScope.Transient:
            default:
                return false
        }
    }
}

export const container = new IOC()
