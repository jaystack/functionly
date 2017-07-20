import { expect } from 'chai'

import { AzureProvider } from '../src/providers/azure'
import { LocalProvider } from '../src/providers/local'
import { AWSProvider } from '../src/providers/aws'
import { addProvider, removeProvider } from '../src/providers'
import { FunctionalService } from '../src/classes/functionalService'
import { httpTrigger, inject, injectable, param, rest } from '../src/annotations'

describe('invoke', () => {
    const FUNCTIONAL_ENVIRONMENT = 'custom'

    describe('general', () => {
        beforeEach(() => {
            process.env.FUNCTIONAL_ENVIRONMENT = FUNCTIONAL_ENVIRONMENT
        })
        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            removeProvider(FUNCTIONAL_ENVIRONMENT)
        })

        it("no params", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invoke(serviceInstance, params, invokeConfig?) {
                    counter++

                    expect(serviceInstance).to.instanceof(A)
                    expect(params).to.have.deep.equal({})
                    expect(invokeConfig).is.undefined
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle() { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({})
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("with params", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invoke(serviceInstance, params, invokeConfig?) {
                    counter++

                    expect(serviceInstance).to.instanceof(A)
                    expect(params).to.have.deep.equal({ p1: 'p1' })
                    expect(invokeConfig).is.undefined
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("additional property that not listed as param", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invoke(serviceInstance, params, invokeConfig?) {
                    counter++

                    expect(serviceInstance).to.instanceof(A)
                    expect(params).to.have.deep.equal({ p1: 'p1' })
                    expect(invokeConfig).is.undefined
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1', p2: 'p2' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("invokeConfig", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invoke(serviceInstance, params, invokeConfig?) {
                    counter++

                    expect(serviceInstance).to.instanceof(A)
                    expect(params).to.deep.equal({})
                    expect(invokeConfig).to.deep.equal({ a: 1, b: 2, c: 3 })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle() { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({}, { a: 1, b: 2, c: 3 })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("unknown environment", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invoke(serviceInstance, params, invokeConfig?) {
                    counter++

                    expect(false).to.equal(true, 'unknown provider have to select')
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle() { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({})
                }
            }

            const invoker = B.createInvoker()
            process.env.FUNCTIONAL_ENVIRONMENT = 'unknown' 
            await invoker({}, {
                send: () => { expect(false).to.equal(true, 'error required') }
            }, (e) => {
                counter++
                expect(e.message).to.equal("missing environment: 'unknown' for invoke")
            })

            expect(counter).to.equal(2)
        })

        it("unknown environment mode", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invoke(serviceInstance, params, invokeConfig?) {
                    counter++

                    expect(false).to.equal(true, 'unknown provider have to select')
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle() { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({}, { mode: 'unknown' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { expect(false).to.equal(true, 'error required') }
            }, (e) => {
                counter++
                expect(e.message).to.equal("missing environment: 'unknown' for invoke")
            })

            expect(counter).to.equal(2)
        })
    })

    describe('azure', () => {
        const FUNCTIONLY_FUNCTION_KEY = 'xxxxx'
        const FUNCION_APP_BASEURL = 'http://example/api'

        beforeEach(() => {
            process.env.FUNCTIONAL_ENVIRONMENT = FUNCTIONAL_ENVIRONMENT
            process.env.FUNCTIONLY_FUNCTION_KEY = FUNCTIONLY_FUNCTION_KEY
            process.env.FUNCION_APP_BASEURL = FUNCION_APP_BASEURL
        })
        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONLY_FUNCTION_KEY
            delete process.env.FUNCION_APP_BASEURL
            removeProvider(FUNCTIONAL_ENVIRONMENT)
        })

        it("route get /v1/a1", async () => {
            let counter = 0

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ code: FUNCTIONLY_FUNCTION_KEY, p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1' })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

        it("route post /v1/a1", async () => {
            let counter = 0

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'post')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ code: FUNCTIONLY_FUNCTION_KEY })
                    expect(config).to.have.property('body').that.deep.equal({ p1: 'p1' })
                    expect(config).to.have.property('json', true)

                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1', methods: ['post'] })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

        it("multiple method get/post", async () => {
            let counter = 0

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ code: FUNCTIONLY_FUNCTION_KEY, p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1', methods: ['get', 'post'] })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

        it("multiple method post/get", async () => {
            let counter = 0

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'post')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ code: FUNCTIONLY_FUNCTION_KEY })
                    expect(config).to.have.property('body').that.deep.equal({ p1: 'p1' })
                    expect(config).to.have.property('json', true)

                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1', methods: ['post', 'get'] })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

        it("get anonymous", async () => {
            let counter = 0

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1', authLevel: 'anonymous' })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

        it("post anonymous", async () => {
            let counter = 0

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'post')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.not.have.property('qs')
                    expect(config).to.have.property('body').that.deep.equal({ p1: 'p1' })
                    expect(config).to.have.property('json', true)

                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1', methods: ['post'], authLevel: 'anonymous' })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

        it("authLevel function no function key", async () => {
            let counter = 0
            delete process.env.FUNCTIONLY_FUNCTION_KEY

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1' })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 500, context.res.body)
            expect(context).to.have.nested.property('res.body').that.contains('process.env.FUNCTIONLY_FUNCTION_KEY is not set')
            expect(counter).to.equal(1)
        })

        it("authLevel anonymous no function key", async () => {
            let counter = 0
            delete process.env.FUNCTIONLY_FUNCTION_KEY

            class TestProvider extends AzureProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${FUNCION_APP_BASEURL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @httpTrigger({ route: '/v1/a1', authLevel: 'anonymous' })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            const context: any = {}
            await invoker(context, {})

            expect(context).to.have.nested.property('res.status', 200, context.res.body)
            expect(counter).to.equal(2)
        })

    })

    describe('local', () => {
        const APP_BASE_URL = 'http://localhost:3000'
        const FUNCTIONAL_LOCAL_PORT = 3000

        beforeEach(() => {
            process.env.FUNCTIONAL_ENVIRONMENT = FUNCTIONAL_ENVIRONMENT
            process.env.FUNCTIONAL_LOCAL_PORT = FUNCTIONAL_LOCAL_PORT
        })
        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONAL_LOCAL_PORT
            removeProvider(FUNCTIONAL_ENVIRONMENT)
        })

        it("route get /v1/a1", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${APP_BASE_URL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @rest({ path: '/v1/a1' })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("route post /v1/a1", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'post')
                    expect(config).to.have.property('url', `${APP_BASE_URL}/v1/a1`)
                    expect(config).to.have.not.property('qs')
                    expect(config).to.have.property('body').that.deep.equal({ p1: 'p1' })
                    expect(config).to.have.property('json', true)

                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @rest({ path: '/v1/a1', methods: ['post'] })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("multiple method get/post", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'get')
                    expect(config).to.have.property('url', `${APP_BASE_URL}/v1/a1`)
                    expect(config).to.have.property('qs').that.deep.equal({ p1: 'p1' })
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @rest({ path: '/v1/a1', methods: ['get', 'post'] })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })

        it("multiple method post/get", async () => {
            let counter = 0

            class TestProvider extends LocalProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('method', 'post')
                    expect(config).to.have.property('url', `${APP_BASE_URL}/v1/a1`)
                    expect(config).to.have.not.property('qs')
                    expect(config).to.have.property('body').that.deep.equal({ p1: 'p1' })
                    expect(config).to.have.property('json', true)

                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @rest({ path: '/v1/a1', methods: ['post', 'get'] })
            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()
            await invoker({}, {
                send: () => { counter++ }
            }, (e) => { expect(false).to.equal(true, e.message) })

            expect(counter).to.equal(3)
        })
    })

    describe('aws', () => {
        beforeEach(() => {
            process.env.FUNCTIONAL_ENVIRONMENT = FUNCTIONAL_ENVIRONMENT
        })
        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            removeProvider(FUNCTIONAL_ENVIRONMENT)
        })

        it("lambda call", async () => {
            let counter = 0

            class TestProvider extends AWSProvider {
                public async invokeExec(config: any): Promise<any> {
                    counter++

                    expect(config).to.have.property('FunctionName', 'A')
                    expect(config).to.have.property('Payload', JSON.stringify({ p1: 'p1' }))
                }
            }
            addProvider(FUNCTIONAL_ENVIRONMENT, new TestProvider())

            @injectable
            class A extends FunctionalService {
                public async handle( @param p1) { }
            }

            class B extends FunctionalService {
                public async handle( @inject(A) a: A) {
                    counter++
                    const aResult = await a.invoke({ p1: 'p1' })
                }
            }

            const invoker = B.createInvoker()

            await invoker({}, {}, (e, result) => {
                counter++
                expect(!e).to.equal(true, e && e.message)
            })

            expect(counter).to.equal(3)
        })
    })
})