import { injectable, InjectionScope, inject } from '../src/annotations'
import { IOC, container } from '../src/helpers/ioc'

import { LocalProvider } from '../src/providers/local'
import { addProvider, removeProvider } from '../src/providers'
import { FunctionalService } from '../src/classes/functionalService'
import { Api } from '../src/classes/api'
import { Service } from '../src/classes/service'

import { expect } from 'chai'

describe('IOC', () => {
    const FUNCTIONAL_ENVIRONMENT = 'custom'
    let mycontainer: IOC = null;

    beforeEach(() => {
        mycontainer = new IOC();
        process.env.FUNCTIONAL_ENVIRONMENT = FUNCTIONAL_ENVIRONMENT
    })

    afterEach(() => {
        delete process.env.FUNCTIONAL_ENVIRONMENT
        removeProvider(FUNCTIONAL_ENVIRONMENT)
    })

    it("interface", () => {
        expect(mycontainer).has.property('registerType').that.to.be.a('function')
        expect(mycontainer).has.property('clearType').that.to.be.a('function')
        expect(mycontainer).has.property('resolveType').that.to.be.a('function')
        expect(mycontainer).has.property('registerInstance').that.to.be.a('function')
        expect(mycontainer).has.property('resolve').that.to.be.a('function')
        expect(mycontainer).has.property('containsInstance').that.to.be.a('function')
    })

    it("resolveType", () => {
        class MyType { }
        const a = mycontainer.resolveType(MyType)
        expect(a).to.equal(MyType)
    })

    it("registerType", () => {
        class MyType1 { }
        class MyType2 { }
        mycontainer.registerType(MyType1, MyType2)
        const a = mycontainer.resolveType(MyType1)
        expect(a).to.equal(MyType2)
    })

    it("clearType", () => {
        class MyType1 { }
        class MyType2 { }
        mycontainer.registerType(MyType1, MyType2)
        const a = mycontainer.resolveType(MyType1)
        expect(a).to.equal(MyType2)

        mycontainer.clearType(MyType1)

        const b = mycontainer.resolveType(MyType1)
        expect(b).to.equal(MyType1)
    })

    it("InjectionScope: not marked as injectable", () => {
        class MyType { }
        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const b = mycontainer.resolve(MyType)
        expect(b).instanceof(MyType)

        expect(a).is.not.equal(b)
    })

    it("InjectionScope: default", () => {
        @injectable()
        class MyType { }
        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const b = mycontainer.resolve(MyType)
        expect(b).instanceof(MyType)

        expect(a).is.not.equal(b)
    })

    it("InjectionScope: Transient", () => {
        @injectable(InjectionScope.Transient)
        class MyType { }
        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const b = mycontainer.resolve(MyType)
        expect(b).instanceof(MyType)

        expect(a).is.not.equal(b)
    })

    it("InjectionScope: Singleton", () => {
        @injectable(InjectionScope.Singleton)
        class MyType { }
        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const b = mycontainer.resolve(MyType)
        expect(b).instanceof(MyType)

        expect(a).is.equal(b)
    })

    it("InjectionScope: Transient, conainsInstance", () => {
        @injectable(InjectionScope.Transient)
        class MyType { }
        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const contains = mycontainer.containsInstance(MyType)
        expect(contains).is.equal(false)
    })

    it("InjectionScope: Singleton, conainsInstance", () => {
        @injectable(InjectionScope.Singleton)
        class MyType { }
        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const contains = mycontainer.containsInstance(MyType)
        expect(contains).is.equal(true)
    })

    it("InjectionScope: Transient, registerInstance", () => {
        @injectable(InjectionScope.Transient)
        class MyType { }

        const instance = new MyType()
        mycontainer.registerInstance(MyType, instance)

        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const contains = mycontainer.containsInstance(MyType)
        expect(contains).is.equal(false)

        const b = mycontainer.resolve(MyType)
        expect(b).instanceof(MyType)

        expect(a).is.not.equal(b)
    })

    it("InjectionScope: Singleton, registerInstance", () => {
        @injectable(InjectionScope.Singleton)
        class MyType { }

        const instance = new MyType()
        mycontainer.registerInstance(MyType, instance)

        const a = mycontainer.resolve(MyType)
        expect(a).instanceof(MyType)

        const contains = mycontainer.containsInstance(MyType)
        expect(contains).is.equal(true)

        const b = mycontainer.resolve(MyType)
        expect(b).instanceof(MyType)

        expect(a).is.equal(b)
    })

    it("InjectionScope: Transient, registerType Transient", () => {
        @injectable(InjectionScope.Transient)
        class MyTypeA { }

        @injectable(InjectionScope.Transient)
        class MyTypeB { }

        mycontainer.registerType(MyTypeA, MyTypeB)

        const a = mycontainer.resolve(MyTypeA)
        expect(a).instanceof(MyTypeB)

        const b = mycontainer.resolve(MyTypeA)
        expect(b).instanceof(MyTypeB)

        expect(a).is.not.equal(b)
    })

    it("InjectionScope: Singleton, registerType Singleton", () => {
        @injectable(InjectionScope.Singleton)
        class MyTypeA { }

        @injectable(InjectionScope.Singleton)
        class MyTypeB { }

        mycontainer.registerType(MyTypeA, MyTypeB)

        const a = mycontainer.resolve(MyTypeA)
        expect(a).instanceof(MyTypeB)

        const b = mycontainer.resolve(MyTypeA)
        expect(b).instanceof(MyTypeB)

        expect(a).is.equal(b)
    })

    it("InjectionScope: Transient, registerType Singleton", () => {
        @injectable(InjectionScope.Transient)
        class MyTypeA { }

        @injectable(InjectionScope.Singleton)
        class MyTypeB { }

        mycontainer.registerType(MyTypeA, MyTypeB)

        const a = mycontainer.resolve(MyTypeA)
        expect(a).instanceof(MyTypeB)

        const b = mycontainer.resolve(MyTypeA)
        expect(b).instanceof(MyTypeB)

        expect(a).is.equal(b)
    })

    it("InjectionScope: Singleton, registerType Transient", () => {
        @injectable(InjectionScope.Singleton)
        class MyTypeA { }

        @injectable(InjectionScope.Transient)
        class MyTypeB { }

        mycontainer.registerType(MyTypeA, MyTypeB)

        const a = mycontainer.resolve(MyTypeA)
        expect(a).instanceof(MyTypeB)

        const b = mycontainer.resolve(MyTypeA)
        expect(b).instanceof(MyTypeB)

        expect(a).is.not.equal(b)
    })

    it("registerType depth 3", () => {
        @injectable()
        class MyTypeA { }

        @injectable()
        class MyTypeB { }

        @injectable()
        class MyTypeC { }

        mycontainer.registerType(MyTypeA, MyTypeB)
        mycontainer.registerType(MyTypeB, MyTypeC)

        const a = mycontainer.resolve(MyTypeA)
        expect(a).instanceof(MyTypeC)
    })



    it("inject remapped api class in ioc", async () => {
        let counter = 0

        addProvider(FUNCTIONAL_ENVIRONMENT, new LocalProvider())

        @injectable()
        class A extends Api { }

        @injectable()
        class AOtherApi extends Api { }

        container.registerType(A, AOtherApi)

        class B extends FunctionalService {
            public static async handle( @inject(A) a: A) {
                counter++

                expect(a).is.instanceof(AOtherApi)
            }
        }

        const invoker = B.createInvoker()
        await invoker({}, {
            send: () => { counter++ }
        }, (e) => { expect(false).to.equal(true, e.message) })

        expect(counter).to.equal(2)
    })

    it("inject remapped service class in ioc", async () => {
        let counter = 0

        addProvider(FUNCTIONAL_ENVIRONMENT, new LocalProvider())

        @injectable()
        class A extends Service {
            public static async handle() {
                counter++
                expect(false).to.equal(true, 'remap required')
            }
        }

        @injectable()
        class AOtherService extends Service {
            public static async handle() {
                counter++
            }
        }

        container.registerType(A, AOtherService)

        class B extends FunctionalService {
            public static async handle( @inject(A) a) {
                counter++

                await a()
            }
        }

        const invoker = B.createInvoker()
        await invoker({}, {
            send: () => { counter++ }
        }, (e) => { expect(false).to.equal(true, e.message) })

        expect(counter).to.equal(3)
    })
})