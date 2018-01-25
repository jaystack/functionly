import { expect } from 'chai'

import { getInvoker } from '../src/providers'
import { FunctionalService, Resource, Service, Api } from '../src/classes'
import { param, inject, injectable, serviceParams, request, functionalServiceName, functionName, provider, stage, InjectionScope } from '../src/annotations'
import { parse } from 'url'


describe('invoker', () => {

    describe("general", () => {
        class MockService extends FunctionalService { }

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
        })

        it("Functional Service createInvoker", () => {
            expect(MockService).to.has.property('createInvoker').that.to.be.a('function')
        })

        it("Service createInvoker", () => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            const invoker = MockService.createInvoker()
            expect(invoker).to.be.a('function')
        })

        it("inject service", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class CustomService extends Service {
                public async handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('p1', 'CustomService')
                    expect(p2).to.equal('p2', 'CustomService')
                }
            }

            class MockService extends FunctionalService {
                public async handle( @param noparam, @inject(CustomService) myService) {
                    counter++
                    expect(noparam).to.undefined
                    expect(myService).to.instanceof(Function)

                    await myService({ p1: 'p1', p2: 'p2' })
                }
            }

            const invoker = MockService.createInvoker()
            await invoker({}, {
                send: () => {
                    expect(counter).to.equal(2)
                }
            }, (e) => {
                expect(null).to.equal(e)
                throw e
            })

            expect(counter).to.equal(2)
        })

        it("inject api with service", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class CustomService extends Service {
                public async handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('p1', 'CustomService')
                    expect(p2).to.equal('p2', 'CustomService')
                }
            }

            @injectable()
            class CustomApi extends Api {
                private _myService
                public constructor( @inject(CustomService) myService) {
                    super()
                    this._myService = myService
                }
                public async myMethod(p1, p2) {
                    counter++
                    expect(p1).to.equal('p1', 'CustomApi')
                    expect(p2).to.equal('p2', 'CustomApi')

                    await this._myService({ p1, p2 })
                }
            }

            class MockService extends FunctionalService {
                public async handle( @param p1, @inject(CustomApi) api) {
                    counter++
                    expect(p1).to.undefined
                    expect(api).to.instanceof(CustomApi)

                    await api.myMethod('p1', 'p2')
                }
            }

            const invoker = MockService.createInvoker()
            await invoker({}, {
                send: () => {
                    expect(counter).to.equal(3)
                }
            }, (e) => {
                expect(null).to.equal(e)
                throw e
            })

            expect(counter).to.equal(3)
        })

        it("inject async api with service", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class CustomService extends Service {
                public async handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('p1', 'CustomService')
                    expect(p2).to.equal('p2', 'CustomService')
                }
            }

            @injectable()
            class CustomApi extends Api {
                private _myService
                public constructor( @inject(CustomService) myService) {
                    super()
                    this._myService = myService
                }

                public init() {
                    counter++
                    expect(counter).to.equal(1)
                    return new Promise(resolve => {
                        setTimeout(_ => {
                            counter++
                            expect(counter).to.equal(2)

                            resolve()
                        }, 10);
                    })
                }

                public async myMethod(p1, p2) {
                    counter++
                    expect(p1).to.equal('p1', 'CustomApi')
                    expect(p2).to.equal('p2', 'CustomApi')

                    await this._myService({ p1, p2 })
                }
            }

            class MockService extends FunctionalService {
                public async handle( @param p1, @inject(CustomApi) api) {
                    counter++
                    expect(counter).to.equal(3)
                    expect(p1).to.undefined
                    expect(api).to.instanceof(CustomApi)

                    await api.myMethod('p1', 'p2')
                }
            }

            const invoker = MockService.createInvoker()
            await invoker({}, {
                send: () => {
                    expect(counter).to.equal(5)
                }
            }, (e) => {
                expect(null).to.equal(e)
                throw e
            })

            expect(counter).to.equal(5)
        })

        describe("injection modes", () => {
            it("multiple inject transient api with transient service", async () => {
                let counter = 0
                let instanceCreation = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable(InjectionScope.Transient)
                class CustomService extends Service {
                    public constructor() {
                        super()
                        instanceCreation++
                    }
                    public async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomService')
                        expect(p2).to.equal('p2', 'CustomService')
                    }
                }

                @injectable(InjectionScope.Transient)
                class CustomApi extends Api {
                    private _myService
                    public constructor( @inject(CustomService) myService, @inject(CustomService) myService2) {
                        super()
                        instanceCreation++
                        this._myService = myService
                    }
                    public async myMethod(p1, p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomApi')
                        expect(p2).to.equal('p2', 'CustomApi')

                        await this._myService({ p1, p2 })
                    }
                }

                class MockService extends FunctionalService {
                    public async handle( @param p1, @inject(CustomApi) api, @inject(CustomApi) api2) {
                        counter++
                        expect(p1).to.undefined
                        expect(api).to.instanceof(CustomApi)

                        await api.myMethod('p1', 'p2')
                    }
                }

                const invoker = MockService.createInvoker()
                await invoker({}, {
                    send: () => {
                        expect(counter).to.equal(3)
                        expect(instanceCreation).to.equal(6)
                    }
                }, (e) => {
                    expect(null).to.equal(e)
                    throw e
                })

                expect(counter).to.equal(3)
                expect(instanceCreation).to.equal(6)
            })

            it("multiple inject transient api with singleton service", async () => {
                let counter = 0
                let instanceCreation = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable(InjectionScope.Singleton)
                class CustomService extends Service {
                    public constructor() {
                        super()
                        instanceCreation++
                    }
                    public async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomService')
                        expect(p2).to.equal('p2', 'CustomService')
                    }
                }

                @injectable(InjectionScope.Transient)
                class CustomApi extends Api {
                    private _myService
                    public constructor( @inject(CustomService) myService, @inject(CustomService) myService2) {
                        super()
                        instanceCreation++
                        this._myService = myService
                    }
                    public async myMethod(p1, p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomApi')
                        expect(p2).to.equal('p2', 'CustomApi')

                        await this._myService({ p1, p2 })
                    }
                }

                class MockService extends FunctionalService {
                    public async handle( @param p1, @inject(CustomApi) api, @inject(CustomApi) api2) {
                        counter++
                        expect(p1).to.undefined
                        expect(api).to.instanceof(CustomApi)

                        await api.myMethod('p1', 'p2')
                    }
                }

                const invoker = MockService.createInvoker()
                await invoker({}, {
                    send: () => {
                        expect(counter).to.equal(3)
                        expect(instanceCreation).to.equal(3)
                    }
                }, (e) => {
                    expect(null).to.equal(e)
                    throw e
                })

                expect(counter).to.equal(3)
                expect(instanceCreation).to.equal(3)
            })

            it("multiple inject singleton api with transient service", async () => {
                let counter = 0
                let instanceCreation = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable(InjectionScope.Transient)
                class CustomService extends Service {
                    public constructor() {
                        super()
                        instanceCreation++
                    }
                    public async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomService')
                        expect(p2).to.equal('p2', 'CustomService')
                    }
                }

                @injectable(InjectionScope.Singleton)
                class CustomApi extends Api {
                    private _myService
                    public constructor( @inject(CustomService) myService, @inject(CustomService) myService2) {
                        super()
                        instanceCreation++
                        this._myService = myService
                    }
                    public async myMethod(p1, p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomApi')
                        expect(p2).to.equal('p2', 'CustomApi')

                        await this._myService({ p1, p2 })
                    }
                }

                class MockService extends FunctionalService {
                    public async handle( @param p1, @inject(CustomApi) api, @inject(CustomApi) api2) {
                        counter++
                        expect(p1).to.undefined
                        expect(api).to.instanceof(CustomApi)

                        await api.myMethod('p1', 'p2')
                    }
                }

                const invoker = MockService.createInvoker()
                await invoker({}, {
                    send: () => {
                        expect(counter).to.equal(3)
                        expect(instanceCreation).to.equal(3)
                    }
                }, (e) => {
                    expect(null).to.equal(e)
                    throw e
                })

                expect(counter).to.equal(3)
                expect(instanceCreation).to.equal(3)
            })

            it("multiple inject singleton api with singleton service", async () => {
                let counter = 0
                let instanceCreation = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable(InjectionScope.Singleton)
                class CustomService extends Service {
                    public constructor() {
                        super()
                        instanceCreation++
                    }
                    public async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomService')
                        expect(p2).to.equal('p2', 'CustomService')
                    }
                }

                @injectable(InjectionScope.Singleton)
                class CustomApi extends Api {
                    private _myService
                    public constructor( @inject(CustomService) myService, @inject(CustomService) myService2) {
                        super()
                        instanceCreation++
                        this._myService = myService
                    }
                    public async myMethod(p1, p2) {
                        counter++
                        expect(p1).to.equal('p1', 'CustomApi')
                        expect(p2).to.equal('p2', 'CustomApi')

                        await this._myService({ p1, p2 })
                    }
                }

                class MockService extends FunctionalService {
                    public async handle( @param p1, @inject(CustomApi) api, @inject(CustomApi) api2) {
                        counter++
                        expect(p1).to.undefined
                        expect(api).to.instanceof(CustomApi)

                        await api.myMethod('p1', 'p2')
                    }
                }

                const invoker = MockService.createInvoker()
                await invoker({}, {
                    send: () => {
                        expect(counter).to.equal(3)
                        expect(instanceCreation).to.equal(2)
                    }
                }, (e) => {
                    expect(null).to.equal(e)
                    throw e
                })

                expect(counter).to.equal(3)
                expect(instanceCreation).to.equal(2)
            })
        })
    })

    describe("local", () => {

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONAL_STAGE
        })

        it("invoke", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("return value", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(1)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("handler throw error", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                    throw new Error('error in handle')
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(false).to.equal(true, 'skippable code')
                    done()
                }
            }, (e) => {
                expect(counter).to.equal(1)
                expect(e.message).to.equal('error in handle')
                done()
            })
        })

        it("query param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('v1')
                    expect(p2).to.equal('v2')
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                query: {
                    p1: 'v1',
                    p2: 'v2'
                }
            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("body param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('v1')
                    expect(p2).to.equal('v2')
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                body: {
                    p1: 'v1',
                    p2: 'v2'
                }
            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("params param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('v1')
                    expect(p2).to.equal('v2')
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                params: {
                    p1: 'v1',
                    p2: 'v2'
                }
            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("headers param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('v1')
                    expect(p2).to.equal('v2')
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                headers: {
                    p1: 'v1',
                    p2: 'v2'
                }
            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("missing param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('v1')
                    expect(p2).to.undefined
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                params: {
                    p1: 'v1'
                }
            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("params resolve order", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param p1, @param p2, @param p3, @param p4) {
                    counter++
                    expect(p1).to.equal('body')
                    expect(p2).to.equal('query')
                    expect(p3).to.equal('params')
                    expect(p4).to.equal('headers')
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                body: {
                    p1: 'body'
                },
                query: {
                    p1: 'query',
                    p2: 'query'
                },
                params: {
                    p1: 'params',
                    p2: 'params',
                    p3: 'params'
                },
                headers: {
                    p1: 'headers',
                    p2: 'headers',
                    p3: 'headers',
                    p4: 'headers'
                }

            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("params resolve hint", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param({ source: 'event.req.query' }) p1, @param({ source: 'event.req.params' }) p2, @param({ source: 'event.req.headers' }) p3, @param p4) {
                    counter++
                    expect(p1).to.equal('query')
                    expect(p2).to.equal('params')
                    expect(p3).to.equal('headers')
                    expect(p4).to.equal('headers')
                }
            }

            const invoker = MockService.createInvoker()
            const req = {
                body: {
                    p1: 'body'
                },
                query: {
                    p1: 'query',
                    p2: 'query'
                },
                params: {
                    p1: 'params',
                    p2: 'params',
                    p3: 'params'
                },
                headers: {
                    p1: 'headers',
                    p2: 'headers',
                    p3: 'headers',
                    p4: 'headers'
                }

            }
            invoker(req, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("inject param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class MockInjectable extends Resource { }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(MockInjectable) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Resource)
                    expect(p2).to.instanceof(MockInjectable)
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, (e) => { e && done(e) })
        })

        it("inject service", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class CustomService extends Service {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('p1')
                    expect(p2).to.equal('p2')
                }
            }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(CustomService) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Function)

                    p2({ p1: 'p1', p2: 'p2' })
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {
                send: () => {
                    expect(counter).to.equal(2)
                    done()
                }
            }, (e) => { e && done(e) })
        })


        it("serviceParams param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class MockInjectable extends Resource { }

            const req = {}
            const res = {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }
            const next = (e) => { e && done(e) }

            class MockService extends FunctionalService {
                handle( @param p1, @serviceParams p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.have.property('req').that.to.equal(req)
                    expect(p2).to.have.property('res').that.to.equal(res)
                    expect(p2).to.have.property('next').that.to.equal(next)
                }
            }

            const invoker = MockService.createInvoker()
            invoker(req, res, next)
        })

        it("request originalUrl param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class MockInjectable extends Resource { }

            const req = {
                originalUrl: '/a/b',
                method: 'GET',
                body: {
                    p1: 'body'
                },
                query: {
                    p2: 'query'
                },
                params: {
                    p3: 'params'
                },
                headers: {
                    p4: 'headers'
                },
                anyprop: {}
            }
            const res = {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }
            const next = (e) => { e && done(e) }

            class MockService extends FunctionalService {
                handle( @param p1, @request r) {
                    counter++
                    expect(r).to.have.property('url').that.deep.equal(parse(req.originalUrl))
                    expect(r).to.have.property('method', req.method)
                    expect(r).to.have.property('body').that.deep.equal(req.body)
                    expect(r).to.have.property('query').that.deep.equal(req.query)
                    expect(r).to.have.property('params').that.deep.equal(req.params)
                    expect(r).to.have.property('headers').that.deep.equal(req.headers)
                    expect(r).to.not.have.property('anyprop')
                }
            }

            const invoker = MockService.createInvoker()
            invoker(req, res, next)
        })

        it("request _parsedUrl param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class MockInjectable extends Resource { }

            const req = {
                originalUrl: '/a/b?a=b',
                _parsedUrl: parse('/b/c?a=b2'),
                method: 'GET',
                body: {
                    p1: 'body'
                },
                query: {
                    p2: 'query'
                },
                params: {
                    p3: 'params'
                },
                headers: {
                    p4: 'headers'
                },
                anyprop: {}
            }
            const res = {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }
            const next = (e) => { e && done(e) }

            class MockService extends FunctionalService {
                handle( @param p1, @request r) {
                    counter++
                    expect(r).to.have.property('url').that.deep.equal(req._parsedUrl)
                    expect(r).to.have.property('method', req.method)
                    expect(r).to.have.property('body').that.deep.equal(req.body)
                    expect(r).to.have.property('query').that.deep.equal(req.query)
                    expect(r).to.have.property('params').that.deep.equal(req.params)
                    expect(r).to.have.property('headers').that.deep.equal(req.headers)
                    expect(r).to.not.have.property('anyprop')
                }
            }

            const invoker = MockService.createInvoker()
            invoker(req, res, next)
        })

        it("generic result format", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable()
            class MockInjectable extends Resource { }

            const req = {
            }
            const res = {
                send: (data) => {
                    counter++
                    expect(data).to.deep.equal({
                        ok: 1
                    })
                },
                status: (code) => {
                    counter++
                    expect(code).to.equal(201)
                },
                set: (headers) => {
                    counter++
                    expect(headers).to.deep.equal({
                        'content-type': 'application/json'
                    })
                }
            }
            const next = (e) => { expect(true).to.equal(false, e.message) }

            class MockService extends FunctionalService {
                handle() {
                    counter++

                    return {
                        status: 201,
                        headers: {
                            'content-type': 'application/json'
                        },
                        data: {
                            ok: 1
                        }
                    }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(req, res, next)

            expect(counter).to.equal(4)
        })

        it("functionalServiceName", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            const req = {
            }
            const res = {
                send: (data) => {
                    counter++
                }
            }
            const next = (e) => { expect(true).to.equal(false, e.message) }

            class MockService extends FunctionalService {
                handle( @functionalServiceName serviceName) {
                    counter++

                    expect(serviceName).to.equal('MockService')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(req, res, next)

            expect(counter).to.equal(2)
        })

        it("functionalServiceName with functionName decorator", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            const req = {
            }
            const res = {
                send: (data) => {
                    counter++
                }
            }
            const next = (e) => { expect(true).to.equal(false, e.message) }

            @functionName('MyMockService')
            class MockService extends FunctionalService {
                handle( @functionalServiceName serviceName) {
                    counter++

                    expect(serviceName).to.equal('MyMockService')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(req, res, next)

            expect(counter).to.equal(2)
        })

        it("provider", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            const req = {
            }
            const res = {
                send: (data) => {
                    counter++
                }
            }
            const next = (e) => { expect(true).to.equal(false, e.message) }

            class MockService extends FunctionalService {
                handle( @provider provider) {
                    counter++

                    expect(provider).to.equal('local')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(req, res, next)

            expect(counter).to.equal(2)
        })

        it("stage", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'dev'

            const req = {
            }
            const res = {
                send: (data) => {
                    counter++
                }
            }
            const next = (e) => { expect(true).to.equal(false, e.message) }

            class MockService extends FunctionalService {
                handle( @stage stage) {
                    counter++

                    expect(stage).to.equal('dev')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(req, res, next)

            expect(counter).to.equal(2)
        })
    })

    describe("aws", () => {

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONAL_STAGE
        })

        it("invoke", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {}, (e) => {
                expect(counter).to.equal(1)
                done(e)
            })
        })

        it("return value", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {}, (e, result) => {
                expect(counter).to.equal(1)
                expect(result).to.deep.equal({ ok: 1 })
                done(e)
            })
        })

        it("handler throw error", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                    throw new Error('error in handle')
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {}, (e, result) => {
                counter++
                expect(counter).to.equal(2)
                expect(e.message).to.equal('error in handle')
                done()
            })
        })

        describe("eventSources", () => {

            it("lambda param error", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    p1: undefined,
                    p2: 'v2'
                }
                invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                    expect(e).is.instanceof(Error)
                    done()
                })
            })

            it("lambda param", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    p1: 'v1',
                    p2: 'v2'
                }
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
                })
            })

            it("api gateway error", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    body: {
                        p2: 'v2'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(500)
            })

            it("api gateway body param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    body: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway string body param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    body: JSON.stringify({
                        p1: 'v1',
                        p2: 'v2'
                    })
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway query param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    queryStringParameters: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway pathParameters param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    pathParameters: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway header param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    headers: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway params resolve order", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param p1, @param p2, @param p3, @param p4) {
                        counter++
                        expect(p1).to.equal('body')
                        expect(p2).to.equal('queryStringParameters')
                        expect(p3).to.equal('pathParameters')
                        expect(p4).to.equal('headers')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    body: {
                        p1: 'body'
                    },
                    queryStringParameters: {
                        p1: 'queryStringParameters',
                        p2: 'queryStringParameters'
                    },
                    pathParameters: {
                        p1: 'pathParameters',
                        p2: 'pathParameters',
                        p3: 'pathParameters'
                    },
                    headers: {
                        p1: 'headers',
                        p2: 'headers',
                        p3: 'headers',
                        p4: 'headers'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway params resolve hint", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle( @param({ source: 'event.event.queryStringParameters' }) p1, @param({ source: 'event.event.pathParameters' }) p2, @param({ source: 'event.event.headers' }) p3, @param p4) {
                        counter++
                        expect(p1).to.equal('queryStringParameters')
                        expect(p2).to.equal('pathParameters')
                        expect(p3).to.equal('headers')
                        expect(p4).to.equal('headers')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                    body: {
                        p1: 'body'
                    },
                    queryStringParameters: {
                        p1: 'queryStringParameters',
                        p2: 'queryStringParameters'
                    },
                    pathParameters: {
                        p1: 'pathParameters',
                        p2: 'pathParameters',
                        p3: 'pathParameters'
                    },
                    headers: {
                        p1: 'headers',
                        p2: 'headers',
                        p3: 'headers',
                        p4: 'headers'
                    }
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
            })

            it("api gateway return value", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle() {
                        counter++
                        return { ok: 1 }
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
                expect(r).to.deep.equal({
                    statusCode: 200,
                    headers: {},
                    body: '{"ok":1}'
                })
            })

            it("api gateway return value advanced", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle() {
                        counter++
                        return {
                            statusCode: 200,
                            body: 'myresult'
                        }
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(200, r.body)
                expect(r).to.deep.equal({
                    statusCode: 200,
                    body: 'myresult'
                })
            })

            it("api gateway return value advanced - error", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle() {
                        counter++
                        return {
                            statusCode: 500,
                            body: 'myerror'
                        }
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(500, r.body)
                expect(r).to.deep.equal({
                    statusCode: 500,
                    body: 'myerror'
                })
            })

            it("api gateway return value advanced - throw error", async () => {
                let counter = 0

                class MyError extends Error {
                    constructor(public name, ...params) {
                        super(...params);
                    }
                }

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    async handle() {
                        counter++
                        throw new MyError('error in handle')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                const r = await invoker(awsEvent, {}, (e) => {
                    counter++
                    expect(counter).to.equal(2)
                })

                expect(counter).to.equal(2)
                expect(r.statusCode).to.equal(500, r.body)
                expect(r).to.deep.equal({
                    statusCode: 500,
                    headers: {},
                    body: JSON.stringify(new MyError('error in handle'))
                })
            })

            it("s3 param", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                const awsEvent = {
                    Records: [{
                        eventSource: 'aws:s3',
                        s3: {
                            "object": {
                                "key": "filename",
                                "size": 1234,
                                "eTag": "rnd",
                                "sequencer": "sssss"
                            }
                        }
                    }]
                }

                class MockService extends FunctionalService {
                    handle( @param s3, @param('s3.object.key') p2) {
                        counter++
                        expect(s3).to.deep.equal(awsEvent.Records[0].s3)
                        expect(p2).to.equal('filename')
                    }
                }

                const invoker = MockService.createInvoker()

                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
                })
            })

            it("s3 param source", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                const awsEvent = {
                    Records: [{
                        eventSource: 'aws:s3',
                        s3: {
                            "object": {
                                "key": "filename",
                                "size": 1234,
                                "eTag": "rnd",
                                "sequencer": "sssss"
                            }
                        }
                    }]
                }

                class MockService extends FunctionalService {
                    handle( @param s3, @param({ name: 'event.event.Records', source: null }) p2) {
                        counter++
                        expect(s3).to.deep.equal(awsEvent.Records[0].s3)
                        expect(p2).to.have.lengthOf(1);
                        expect(p2).to.deep.equal(awsEvent.Records)
                    }
                }

                const invoker = MockService.createInvoker()

                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
                })
            })

            it("sns param", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                const awsEvent = {
                    Records: [{
                        EventSource: 'aws:sns',
                        Sns: {
                            "Type": "Notification",
                            "Subject": "subject",
                            "Message": "message"
                        }
                    }]
                }

                class MockService extends FunctionalService {
                    handle( @param Sns, @param('Sns.Message') p2) {
                        counter++
                        expect(Sns).to.deep.equal(awsEvent.Records[0].Sns)
                        expect(p2).to.equal('message')
                    }
                }

                const invoker = MockService.createInvoker()

                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
                })
            })

            it("sns param source", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                const awsEvent = {
                    Records: [{
                        EventSource: 'aws:sns',
                        Sns: {
                            "Type": "Notification",
                            "Subject": "subject",
                            "Message": "message"
                        }
                    }]
                }

                class MockService extends FunctionalService {
                    handle( @param Sns, @param({ name: 'event.event.Records', source: null }) p2) {
                        counter++
                        expect(Sns).to.deep.equal(awsEvent.Records[0].Sns)
                        expect(p2).to.have.lengthOf(1);
                        expect(p2).to.deep.equal(awsEvent.Records)
                    }
                }

                const invoker = MockService.createInvoker()

                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
                })
            })

            it("api gateway generic result format", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                @injectable()
                class MockInjectable extends Resource { }

                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                const awsContext = {}
                const cb = (e, result) => {
                    counter++

                    expect(e).is.null

                    expect(result).to.deep.equal({
                        statusCode: 201,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            ok: 1
                        })
                    })
                }

                class MockService extends FunctionalService {
                    handle() {
                        counter++

                        return {
                            status: 201,
                            headers: {
                                'content-type': 'application/json'
                            },
                            data: {
                                ok: 1
                            }
                        }
                    }
                }

                const invoker = MockService.createInvoker()
                await invoker(awsEvent, awsContext, cb)

                expect(counter).to.equal(2)
            })
        })

        it("inject param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class MockInjectable extends Resource { }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(MockInjectable) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Resource)
                    expect(p2).to.instanceof(MockInjectable)
                }
            }

            const invoker = MockService.createInvoker()

            invoker({}, {}, (e) => {
                expect(counter).to.equal(1)
                done(e)
            })
        })

        it("service param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class CustomService extends Service {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('p1')
                    expect(p2).to.equal('p2')
                }
            }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(CustomService) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Function)

                    p2({ p1: 'p1', p2: 'p2' })
                }
            }

            const invoker = MockService.createInvoker()

            invoker({}, {}, (e) => {
                expect(counter).to.equal(2)
                done(e)
            })
        })

        it("serviceParams param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class MockInjectable extends Resource { }

            const awsEvent = {}
            const awsContext = {}
            const cb = (e) => {
                expect(counter).to.equal(1)
                done(e)
            }

            class MockService extends FunctionalService {
                handle( @param p1, @serviceParams p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.have.property('event').that.to.equal(awsEvent)
                    expect(p2).to.have.property('context').that.to.equal(awsContext)
                    expect(p2).to.have.property('cb').that.to.equal(cb)
                }
            }

            const invoker = MockService.createInvoker()
            invoker(awsEvent, awsContext, cb)
        })

        it("request param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class MockInjectable extends Resource { }

            const awsEvent = {
                path: '/a/b',
                httpMethod: 'GET',
                requestContext: { apiId: 'apiId' },
                body: {
                    p1: 'body'
                },
                queryStringParameters: {
                    p2: 'queryStringParameters'
                },
                pathParameters: {
                    p3: 'pathParameters'
                },
                headers: {
                    p4: 'headers'
                },
                anyprop: {}
            }
            const awsContext = {}
            const cb = (e) => {
                expect(counter).to.equal(1)
                done(e)
            }

            class MockService extends FunctionalService {
                handle( @param p1, @request r) {
                    counter++
                    expect(r).to.have.property('url').that.deep.equal(parse(awsEvent.path))
                    expect(r).to.have.property('method', awsEvent.httpMethod)
                    expect(r).to.have.property('body').that.deep.equal(awsEvent.body)
                    expect(r).to.have.property('query').that.deep.equal(awsEvent.queryStringParameters)
                    expect(r).to.have.property('params').that.deep.equal(awsEvent.pathParameters)
                    expect(r).to.have.property('headers').that.deep.equal(awsEvent.headers)
                    expect(r).to.not.have.property('anyprop')
                }
            }

            const invoker = MockService.createInvoker()
            invoker(awsEvent, awsContext, cb)
        })

        it("request param - string body", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class MockInjectable extends Resource { }

            const awsEvent = {
                path: '/a/b',
                httpMethod: 'GET',
                requestContext: { apiId: 'apiId' },
                body: '{"p1":"body"}',
                queryStringParameters: {
                    p2: 'queryStringParameters'
                },
                pathParameters: {
                    p3: 'pathParameters'
                },
                headers: {
                    p4: 'headers'
                },
                anyprop: {}
            }
            const awsContext = {}
            const cb = (e) => {
                expect(counter).to.equal(1)
                done(e)
            }

            class MockService extends FunctionalService {
                handle( @param p1, @request r) {
                    counter++
                    expect(r).to.have.property('url').that.deep.equal(parse(awsEvent.path))
                    expect(r).to.have.property('method', awsEvent.httpMethod)
                    expect(r).to.have.property('body').that.deep.equal({ "p1": "body" })
                    expect(r).to.have.property('query').that.deep.equal(awsEvent.queryStringParameters)
                    expect(r).to.have.property('params').that.deep.equal(awsEvent.pathParameters)
                    expect(r).to.have.property('headers').that.deep.equal(awsEvent.headers)
                    expect(r).to.not.have.property('anyprop')
                }
            }

            const invoker = MockService.createInvoker()
            invoker(awsEvent, awsContext, cb)
        })

        it("request param - string body not json", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class MockInjectable extends Resource { }

            const awsEvent = {
                path: '/a/b',
                httpMethod: 'GET',
                requestContext: { apiId: 'apiId' },
                body: 'request body',
                queryStringParameters: {
                    p2: 'queryStringParameters'
                },
                pathParameters: {
                    p3: 'pathParameters'
                },
                headers: {
                    p4: 'headers'
                },
                anyprop: {}
            }
            const awsContext = {}
            const cb = (e) => {
                expect(counter).to.equal(1)
                done(e)
            }

            class MockService extends FunctionalService {
                handle( @param p1, @request r) {
                    counter++
                    expect(r).to.have.property('url').that.deep.equal(parse(awsEvent.path))
                    expect(r).to.have.property('method', awsEvent.httpMethod)
                    expect(r).to.have.property('body').that.equal(awsEvent.body)
                    expect(r).to.have.property('query').that.deep.equal(awsEvent.queryStringParameters)
                    expect(r).to.have.property('params').that.deep.equal(awsEvent.pathParameters)
                    expect(r).to.have.property('headers').that.deep.equal(awsEvent.headers)
                    expect(r).to.not.have.property('anyprop')
                }
            }

            const invoker = MockService.createInvoker()
            invoker(awsEvent, awsContext, cb)
        })

        it("generic result format", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable()
            class MockInjectable extends Resource { }

            const awsEvent = {
            }
            const awsContext = {}
            const cb = (e, result) => {
                counter++

                expect(e).is.null

                expect(result).to.deep.equal({
                    ok: 1
                })
            }

            class MockService extends FunctionalService {
                handle() {
                    counter++

                    return {
                        status: 201,
                        headers: {
                            'content-type': 'application/json'
                        },
                        data: {
                            ok: 1
                        }
                    }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(awsEvent, awsContext, cb)

            expect(counter).to.equal(2)
        })

        it("functionalServiceName", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            const awsEvent = {}
            const awsContext = {}
            const cb = (e, result) => {
                counter++

                expect(result).to.deep.equal({ ok: 1 })
            }

            class MockService extends FunctionalService {
                handle( @functionalServiceName serviceName) {
                    counter++

                    expect(serviceName).to.equal('MockService')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(awsEvent, awsContext, cb)

            expect(counter).to.equal(2)
        })

        it("functionalServiceName with functionName decorator", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            const awsEvent = {}
            const awsContext = {}
            const cb = (e, result) => {
                counter++

                expect(result).to.deep.equal({ ok: 1 })
            }

            @functionName('MyMockService')
            class MockService extends FunctionalService {
                handle( @functionalServiceName serviceName) {
                    counter++

                    expect(serviceName).to.equal('MyMockService')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(awsEvent, awsContext, cb)

            expect(counter).to.equal(2)
        })

        it("provider", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            const awsEvent = {}
            const awsContext = {}
            const cb = (e, result) => {
                counter++

                expect(result).to.deep.equal({ ok: 1 })
            }

            class MockService extends FunctionalService {
                handle( @provider provider) {
                    counter++

                    expect(provider).to.equal('aws')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(awsEvent, awsContext, cb)

            expect(counter).to.equal(2)
        })

        it("stage", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
            process.env.FUNCTIONAL_STAGE = 'dev'

            const awsEvent = {}
            const awsContext = {}
            const cb = (e, result) => {
                counter++

                expect(result).to.deep.equal({ ok: 1 })
            }

            class MockService extends FunctionalService {
                handle( @stage stage) {
                    counter++

                    expect(stage).to.equal('dev')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()
            await invoker(awsEvent, awsContext, cb)

            expect(counter).to.equal(2)
        })
    })

    describe("azure", () => {

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONAL_STAGE
        })

        it("invoke", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                }
            }

            const invoker = MockService.createInvoker()

            const context = {}
            const req = {}

            await invoker(context, req)

            expect(counter).to.equal(1)
        })

        it("return value", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()

            const context = {}
            const req = {}

            await invoker(context, req)

            expect(counter).to.equal(1)
            expect(context).to.have.nested.property('res.status', 200)
            expect(context).to.have.nested.property('res.body').that.deep.equal({ ok: 1 })
        })

        it("handler throw error", async () => {
            let counter = 0
            let ex

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
            class MockService extends FunctionalService {
                handle() {
                    counter++
                    ex = new Error('error in handle')
                    throw ex
                }
            }

            const invoker = MockService.createInvoker()

            const context = {}
            const req = {}

            await invoker(context, req)

            expect(counter).to.equal(1)
            expect(context).to.have.nested.property('res.status', 500)
            expect(context).to.have.nested.property('res.body', `${ex.message} - ${ex.stack}`)
        })

        describe("eventSources", () => {
            it("httpTrigger body param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {
                    body: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }

                await invoker(context, req)

                expect(context).to.have.nested.property('res.status', 200)
                expect(counter).to.equal(1)
            })

            it("httpTrigger query param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {
                    query: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }

                await invoker(context, req)

                expect(context).to.have.nested.property('res.status', 200)
                expect(counter).to.equal(1)
            })

            it("httpTrigger pathParameters param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {
                    params: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }

                await invoker(context, req)

                expect(context).to.have.nested.property('res.status', 200)
                expect(counter).to.equal(1)
            })

            it("httpTrigger header param", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(p1).to.equal('v1')
                        expect(p2).to.equal('v2')
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {
                    headers: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }

                await invoker(context, req)

                expect(context).to.have.nested.property('res.status', 200)
                expect(counter).to.equal(1)
            })

            it("httpTrigger params resolve order", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle( @param p1, @param p2, @param p3, @param p4) {
                        counter++
                        expect(p1).to.equal('body')
                        expect(p2).to.equal('queryStringParameters')
                        expect(p3).to.equal('pathParameters')
                        expect(p4).to.equal('headers')
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {
                    body: {
                        p1: 'body'
                    },
                    query: {
                        p1: 'queryStringParameters',
                        p2: 'queryStringParameters'
                    },
                    params: {
                        p1: 'pathParameters',
                        p2: 'pathParameters',
                        p3: 'pathParameters'
                    },
                    headers: {
                        p1: 'headers',
                        p2: 'headers',
                        p3: 'headers',
                        p4: 'headers'
                    }
                }

                await invoker(context, req)

                expect(context).to.have.nested.property('res.status', 200)
                expect(counter).to.equal(1)
            })

            it("httpTrigger params resolve hint", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle( @param({ source: 'event.req.query' }) p1, @param({ source: 'event.req.params' }) p2, @param({ source: 'event.req.headers' }) p3, @param p4) {
                        counter++
                        expect(p1).to.equal('queryStringParameters')
                        expect(p2).to.equal('pathParameters')
                        expect(p3).to.equal('headers')
                        expect(p4).to.equal('headers')
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {
                    body: {
                        p1: 'body'
                    },
                    query: {
                        p1: 'queryStringParameters',
                        p2: 'queryStringParameters'
                    },
                    params: {
                        p1: 'pathParameters',
                        p2: 'pathParameters',
                        p3: 'pathParameters'
                    },
                    headers: {
                        p1: 'headers',
                        p2: 'headers',
                        p3: 'headers',
                        p4: 'headers'
                    }
                }

                await invoker(context, req)

                expect(context).to.have.nested.property('res.status', 200)
                expect(counter).to.equal(1)
            })

            it("httpTrigger return value", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle() {
                        counter++
                        return { ok: 1 }
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {}

                await invoker(context, req)

                expect(counter).to.equal(1)
                expect(context).to.have.nested.property('res.status', 200)
                expect(context).to.have.nested.property('res.body').that.deep.equal({ ok: 1 })
            })

            it("httpTrigger return value advanced", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle() {
                        counter++
                        return {
                            status: 200,
                            body: 'myresult'
                        }
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {}

                await invoker(context, req)

                expect(counter).to.equal(1)
                expect(context).to.have.nested.property('res.status', 200)
                expect(context).to.have.nested.property('res.body', 'myresult')
            })

            it("httpTrigger return value advanced - error", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle() {
                        counter++
                        return {
                            status: 500,
                            body: 'myerror'
                        }
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {}

                await invoker(context, req)

                expect(counter).to.equal(1)
                expect(context).to.have.nested.property('res.status', 500)
                expect(context).to.have.nested.property('res.body', 'myerror')
            })

            it("httpTrigger return value advanced - throw error", async () => {
                let counter = 0
                let ex

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
                class MockService extends FunctionalService {
                    handle() {
                        counter++
                        ex = new Error('error in handle')
                        throw ex
                    }
                }

                const invoker = MockService.createInvoker()

                const context = {}
                const req = {}

                await invoker(context, req)

                expect(counter).to.equal(1)
                expect(context).to.have.nested.property('res.status', 500)
                expect(context).to.have.nested.property('res.body', `${ex.message} - ${ex.stack}`)
            })
        })

        it("inject api with service", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            @injectable()
            class CustomService extends Service {
                handle( @param p1, @param p2) {
                    counter++
                    expect(p1).to.equal('p1')
                    expect(p2).to.equal('p2')
                }
            }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(CustomService) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Function)

                    p2({ p1: 'p1', p2: 'p2' })
                }
            }

            const invoker = MockService.createInvoker()

            const context = {}
            const req = {}

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(counter).to.equal(2)
        })

        it("serviceParams param", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            @injectable()
            class MockInjectable extends Resource { }

            const context = {}
            const req = {}

            class MockService extends FunctionalService {
                handle( @param p1, @serviceParams p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.have.property('context').that.to.equal(context)
                    expect(p2).to.have.property('req').that.to.equal(req)
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(counter).to.equal(1)
        })

        it("request param", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            @injectable()
            class MockInjectable extends Resource { }

            const context = {}
            const req = {
                originalUrl: 'https://asd.azure.com/api/a/b?code=a&a=b',
                method: 'GET',
                body: {
                    p1: 'body'
                },
                query: {
                    p2: 'queryStringParameters'
                },
                params: {
                    p3: 'pathParameters'
                },
                headers: {
                    p4: 'headers'
                }
            }

            class MockService extends FunctionalService {
                handle( @param p1, @request r) {
                    counter++
                    expect(r).to.have.property('url').that.deep.equal(parse(req.originalUrl))
                    expect(r).to.have.property('method', req.method)
                    expect(r).to.have.property('body').that.deep.equal(req.body)
                    expect(r).to.have.property('query').that.deep.equal(req.query)
                    expect(r).to.have.property('params').that.deep.equal(req.params)
                    expect(r).to.have.property('headers').that.deep.equal(req.headers)
                    expect(r).to.not.have.property('anyprop')
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(counter).to.equal(1)
        })

        it("generic result format", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            @injectable()
            class MockInjectable extends Resource { }

            const context = {}
            const req = {
            }

            class MockService extends FunctionalService {
                handle() {
                    counter++

                    return {
                        status: 201,
                        headers: {
                            'content-type': 'application/json'
                        },
                        data: {
                            ok: 1
                        }
                    }
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 201)
            expect(context).to.have.nested.property('res.headers').that.deep.equal({
                'content-type': 'application/json'
            })
            expect(context).to.have.nested.property('res.body').that.deep.equal({
                ok: 1
            })
            expect(counter).to.equal(1)
        })

        it("functionalServiceName", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            const context = {}
            const req = {}

            class MockService extends FunctionalService {
                handle( @functionalServiceName serviceName) {
                    counter++

                    expect(serviceName).to.equal('MockService')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(context).to.have.nested.property('res.body').that.deep.equal({ ok: 1 })
            expect(counter).to.equal(1)
        })

        it("functionalServiceName with functionName decorator", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            const context = {}
            const req = {}

            @functionName('MyMockService')
            class MockService extends FunctionalService {
                handle( @functionalServiceName serviceName) {
                    counter++

                    expect(serviceName).to.equal('MyMockService')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(context).to.have.nested.property('res.body').that.deep.equal({ ok: 1 })
            expect(counter).to.equal(1)
        })

        it("provider", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            const context = {}
            const req = {}

            class MockService extends FunctionalService {
                handle( @provider provider) {
                    counter++

                    expect(provider).to.equal('azure')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(context).to.have.nested.property('res.body').that.deep.equal({ ok: 1 })
            expect(counter).to.equal(1)
        })

        it("stage", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
            process.env.FUNCTIONAL_STAGE = 'dev'

            const context = {}
            const req = {}

            class MockService extends FunctionalService {
                handle( @stage stage) {
                    counter++

                    expect(stage).to.equal('dev')

                    return { ok: 1 }
                }
            }

            const invoker = MockService.createInvoker()

            await invoker(context, req)

            expect(context).to.have.nested.property('res.status', 200)
            expect(context).to.have.nested.property('res.body').that.deep.equal({ ok: 1 })
            expect(counter).to.equal(1)
        })
    })
})