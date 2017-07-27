import { expect } from 'chai'

import { FunctionalService, Service } from '../src/classes'
import { param, inject, injectable } from '../src/annotations'
import { addProvider, removeProvider } from '../src/providers'
import { LocalProvider } from '../src/providers/local'

import { PARAMETER_PARAMKEY } from '../src/annotations/constants'
import { getMetadata } from '../src/annotations/metadata'

describe('service events', () => {
    afterEach(() => {
        delete process.env.FUNCTIONAL_ENVIRONMENT
    })

    describe("local", () => {
        describe("onInject", () => {
            it("static onInject", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)
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

            it("static onInject return", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)

                        return { mockRetrurn: 1 }
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.not.instanceof(Service)
                        expect(p1).to.not.instanceof(MockInjectable)
                        expect(p1).to.deep.equal({ mockRetrurn: 1 })
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

            it("onInject", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable
                class MockInjectable extends Service {
                    public async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)
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

            it("static onInject - onInject both called", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                    public async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)
                    }
                }

                const invoker = MockService.createInvoker()
                invoker({}, {
                    send: () => {
                        expect(counter).to.equal(3)
                        done()
                    }
                }, (e) => { e && done(e) })
            })

            it("static onInject return - onInject skipped", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)

                        return { mockRetrurn: 1 }
                    }
                    public async onInject({ parameter }) {
                        counter++
                        expect(false).to.equal(true, 'skippable code')
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.not.instanceof(Service)
                        expect(p1).to.not.instanceof(MockInjectable)
                        expect(p1).to.deep.equal({ mockRetrurn: 1 })
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
        })

        describe("onHandle", () => {
            it("onHandle call", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++

                        return { ok: 1 }
                    }

                    public async onHandle_local(req, res, next) {
                        counter++

                        expect(req).to.deep.equal({ body: { p1: 1, p2: 2 } })
                    }
                }

                const invoker = MockService.createInvoker()

                const req = {
                    body: { p1: 1, p2: 2 }
                }
                invoker(req, {
                    send: (result) => {
                        expect(counter).to.equal(2)
                        expect(result).to.deep.equal({ ok: 1 })
                        done()
                    }
                }, (e) => { e && done(e) })
            })

            it("onHandle call return", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(false).to.equal(true, 'skippable code')

                        return { ok: 1 }
                    }

                    public async onHandle_local(req, res, next) {
                        counter++

                        expect(req).to.deep.equal({ body: { p1: 1, p2: 2 } })

                        res.send({ ok: 2 })
                        return true
                    }
                }

                const invoker = MockService.createInvoker()

                const req = {
                    body: { p1: 1, p2: 2 }
                }
                invoker(req, {
                    send: (result) => {
                        expect(counter).to.equal(1)
                        expect(result).to.deep.equal({ ok: 2 })
                        done()
                    }
                }, (e) => { e && done(e) })
            })
        })
    })

    describe("aws", () => {
        describe("onInject", () => {
            it("static onInject", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)
                    }
                }

                const invoker = MockService.createInvoker()
                invoker({}, {}, (e) => {
                    expect(counter).to.equal(2)
                    done(e)
                })
            })

            it("static onInject return", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)

                        return { mockRetrurn: 1 }
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.not.instanceof(Service)
                        expect(p1).to.not.instanceof(MockInjectable)
                        expect(p1).to.deep.equal({ mockRetrurn: 1 })
                    }
                }

                const invoker = MockService.createInvoker()
                invoker({}, {}, (e) => {
                    expect(counter).to.equal(2)
                    done(e)
                })
            })

            it("onInject", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                @injectable
                class MockInjectable extends Service {
                    public async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)
                    }
                }

                const invoker = MockService.createInvoker()
                invoker({}, {}, (e) => {
                    expect(counter).to.equal(2)
                    done(e)
                })
            })

            it("static onInject - onInject both called", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                    public async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)
                    }
                }

                const invoker = MockService.createInvoker()
                invoker({}, {}, (e) => {
                    expect(counter).to.equal(3)
                    done(e)
                })
            })

            it("static onInject return - onInject skipped", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                @injectable
                class MockInjectable extends Service {
                    public static async onInject({ parameter }) {
                        counter++

                        const value = getMetadata(PARAMETER_PARAMKEY, MockService, 'handle')
                        expect(value).to.have.lengthOf(1);
                        const metadata = value[0]

                        expect(metadata).to.deep.equal(parameter)

                        return { mockRetrurn: 1 }
                    }
                    public async onInject({ parameter }) {
                        counter++
                        expect(false).to.equal(true, 'skippable code')
                    }
                }

                class MockService extends FunctionalService {
                    handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.not.instanceof(Service)
                        expect(p1).to.not.instanceof(MockInjectable)
                        expect(p1).to.deep.equal({ mockRetrurn: 1 })
                    }
                }

                const invoker = MockService.createInvoker()
                invoker({}, {}, (e) => {
                    expect(counter).to.equal(2)
                    done(e)
                })
            })
        })

        describe("onHandle", () => {
            it("onHandle call", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++

                        return { ok: 1 }
                    }

                    public async onHandle_aws(event, context, cb) {
                        counter++

                        expect(event).to.deep.equal({ p1: 1, p2: 2 })
                    }
                }

                const invoker = MockService.createInvoker()

                const awsEvent = {
                    p1: 1,
                    p2: 2
                }
                invoker(awsEvent, {}, (e, result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done(e)
                })
            })

            it("onHandle call return", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

                class MockService extends FunctionalService {
                    handle( @param p1, @param p2) {
                        counter++
                        expect(false).to.equal(true, 'skippable code')

                        return { ok: 1 }
                    }

                    public async onHandle_aws(event, context, cb) {
                        counter++

                        expect(event).to.deep.equal({ p1: 1, p2: 2 })

                        cb(null, { ok: 2 })
                        return true
                    }
                }

                const invoker = MockService.createInvoker()

                const awsEvent = {
                    p1: 1,
                    p2: 2
                }
                invoker(awsEvent, {}, (e, result) => {
                    expect(counter).to.equal(1)
                    expect(result).to.deep.equal({ ok: 2 })
                    done(e)
                })
            })
        })
    })


    describe("mock", () => {
        class MockProvider extends LocalProvider {
            public async invoke(serviceInstance, params, invokeConfig?): Promise<any> { }
        }
        before(() => {
            addProvider('mock', new MockProvider())
        })
        after(() => {
            removeProvider('mock')
        })


        describe("onInvoke", () => {
            it("onInvoke", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'mock'

                @injectable
                class MockInjectable extends FunctionalService {
                    onInvoke({ params, invokeConfig }) {
                        counter++

                        expect(params).to.deep.equal({ p1: 1, p2: 2 })
                        expect(invokeConfig).to.deep.equal({ config: 1 })
                    }
                }

                class MockService extends FunctionalService {
                    async handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)

                        await p1.invoke({ p1: 1, p2: 2 }, { config: 1 })
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
            it("onInvoke mock", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'mock'

                @injectable
                class MockInjectable extends FunctionalService {
                    handle( @param p1) { }
                    onInvoke_mock({ invokeParams, params, invokeConfig, parameterMapping, currentEnvironment, environmentMode }) {
                        counter++

                        expect(invokeParams).to.deep.equal({ p1: 1, p2: 2 })
                        expect(params).to.deep.equal({ p1: 1 })
                        expect(parameterMapping).to.have.lengthOf(1);
                        expect(parameterMapping[0]).to.deep.equal({
                            from: 'p1',
                            parameterIndex: 0,
                            type: 'param'
                        })
                        expect(currentEnvironment).to.instanceof(MockProvider)
                        expect(environmentMode).to.equal('mock')
                    }
                }

                class MockService extends FunctionalService {
                    async handle( @inject(MockInjectable) p1) {
                        counter++
                        expect(p1).to.instanceof(Service)
                        expect(p1).to.instanceof(MockInjectable)

                        await p1.invoke({ p1: 1, p2: 2 }, { config: 1 })
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
        })
    })
})