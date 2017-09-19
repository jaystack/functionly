
import { getOwnMetadata } from '../annotations/metadata'
import { CLASS_INJECTABLEKEY } from '../annotations/constants'
import { InjectionScope } from '../annotations/classes/injectable'

export interface ClassFunction<T> {
    new(...args): T;
}

export class IOC {
    private instances: Map<ClassFunction<any>, any>
    private classes: Map<ClassFunction<any>, ClassFunction<any>>
    public constructor() {
        this.instances = new Map<ClassFunction<any>, any>()
        this.classes = new Map<ClassFunction<any>, ClassFunction<any>>()
    }

    public registerType<F, T>(from: ClassFunction<F>, to: ClassFunction<T>) {
        this.classes.set(from, to)
    }

    public registerInstance<T>(type: ClassFunction<T>, instance) {
        this.instances.set(type, instance)
    }
    public resolve<T>(type: ClassFunction<T>, ...params): T {
        const resolveType = this.resolveType(type)
        const scope = getOwnMetadata(CLASS_INJECTABLEKEY, resolveType) || InjectionScope.Transient
        switch (scope) {
            case InjectionScope.Singleton:
                if (!this.instances.has(resolveType)) {
                    this.instances.set(resolveType, new resolveType(...params))
                }

                return this.instances.get(resolveType)
            case InjectionScope.Transient:
            default:
                return new resolveType(...params)
        }
    }
    public containsInstance<T>(type: ClassFunction<T>): boolean {
        const resolveType = this.resolveType(type)
        const scope = getOwnMetadata(CLASS_INJECTABLEKEY, resolveType) || InjectionScope.Transient
        switch (scope) {
            case InjectionScope.Singleton:
                return this.instances.has(resolveType)
            case InjectionScope.Transient:
            default:
                return false
        }
    }

    public resolveType(type: ClassFunction<any>) {
        return this.classes.has(type) ? this.resolveType(this.classes.get(type)) : type
    }

}

export const container = new IOC()
