import { expect } from 'chai'

import { getInvoker } from '../src/providers'
import { FunctionalService, Service } from '../src/classes'
import { param, inject, injectable, event } from '../src/annotations'


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
    })

    describe("local", () => {

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
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
            }, () => { })
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
            }, () => { })
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
            }, () => { })
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
            }, () => { })
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
            }, () => { })
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
            }, () => { })
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
            }, () => { })
        })

        it("params resolve hint", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            class MockService extends FunctionalService {
                handle( @param({ source: 'query' }) p1, @param({ source: 'params' }) p2, @param({ source: 'headers' }) p3, @param p4) {
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
            }, () => { })
        })

        it("inject param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable
            class MockInjectable extends Service { }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(MockInjectable) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Service)
                    expect(p2).to.instanceof(MockInjectable)
                }
            }

            const invoker = MockService.createInvoker()
            invoker({}, {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }, () => { })
        })

        it("event param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            @injectable
            class MockInjectable extends Service { }

            const req = {}
            const res = {
                send: () => {
                    expect(counter).to.equal(1)
                    done()
                }
            }
            const next = () => { }

            class MockService extends FunctionalService {
                handle( @param p1, @event p2) {
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
    })

    describe("aws", () => {

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
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
            invoker({}, {}, () => {
                expect(counter).to.equal(1)
                done()
            })
        })

        describe("eventSources", () => {
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
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })

            it("api gateway body param", (done) => {
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
                    requestContext: { apiId: 'apiId' },
                    body: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })

            it("api gateway query param", (done) => {
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
                    requestContext: { apiId: 'apiId' },
                    queryStringParameters: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })

            it("api gateway pathParameters param", (done) => {
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
                    requestContext: { apiId: 'apiId' },
                    pathParameters: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })

            it("api gateway header param", (done) => {
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
                    requestContext: { apiId: 'apiId' },
                    headers: {
                        p1: 'v1',
                        p2: 'v2'
                    }
                }
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })

            it("api gateway params resolve order", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
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
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })

            it("api gateway params resolve hint", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle( @param({ source: 'queryStringParameters' }) p1, @param({ source: 'pathParameters' }) p2, @param({ source: 'headers' }) p3, @param p4) {
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
                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
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

                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
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

                invoker(awsEvent, {}, () => {
                    expect(counter).to.equal(1)
                    done()
                })
            })
        })

        it("inject param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable
            class MockInjectable extends Service { }

            class MockService extends FunctionalService {
                handle( @param p1, @inject(MockInjectable) p2) {
                    counter++
                    expect(p1).to.undefined
                    expect(p2).to.instanceof(Service)
                    expect(p2).to.instanceof(MockInjectable)
                }
            }

            const invoker = MockService.createInvoker()

            invoker({}, {}, () => {
                expect(counter).to.equal(1)
                done()
            })
        })

        it("event param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable
            class MockInjectable extends Service { }

            const awsEvent = { p1: 1, p2: "2" }
            const awsContext = {}
            const cb = () => {
                expect(counter).to.equal(1)
                done()
            }

            class MockService extends FunctionalService {
                handle( @param p1, @event p2) {
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
    })
})