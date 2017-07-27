import { expect } from 'chai'

import { getInvoker } from '../src/providers'
import { FunctionalService, Service } from '../src/classes'
import { param, inject, injectable, serviceParams, request } from '../src/annotations'
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
            }, (e) => { e && done(e) })
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
            }, (e) => { e && done(e) })
        })

        it("serviceParams param", (done) => {
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

            @injectable
            class MockInjectable extends Service { }

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

            @injectable
            class MockInjectable extends Service { }

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
                expect(counter).to.equal(1)
                expect(e.message).to.equal('error in handle')
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
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
                invoker(awsEvent, {}, (e) => {
                    expect(counter).to.equal(1)
                    done(e)
                })
            })

            it("api gateway return value", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle() {
                        counter++
                        return { ok: 1 }
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                invoker(awsEvent, {}, (e, result) => {
                    expect(counter).to.equal(1)
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: '{"ok":1}'
                    })
                    done(e)
                })
            })

            it("api gateway return value advanced", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle() {
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
                invoker(awsEvent, {}, (e, result) => {
                    expect(counter).to.equal(1)
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: 'myresult'
                    })
                    done(e)
                })
            })

            it("api gateway return value advanced - error", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle() {
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
                invoker(awsEvent, {}, (e, result) => {
                    expect(counter).to.equal(1)
                    expect(result).to.deep.equal({
                        statusCode: 500,
                        body: 'myerror'
                    })
                    done(e)
                })
            })

            it("api gateway return value advanced - throw error", (done) => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'aws'
                class MockService extends FunctionalService {
                    handle() {
                        counter++
                        throw new Error('error in handle')
                    }
                }

                const invoker = MockService.createInvoker()
                const awsEvent = {
                    requestContext: { apiId: 'apiId' },
                }
                invoker(awsEvent, {}, (e, result) => {
                    expect(counter).to.equal(1)
                    expect(result).to.deep.equal({
                        statusCode: 500,
                        body: JSON.stringify(new Error('error in handle'))
                    })
                    done(e)
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
                    handle( @param s3, @param({ name: 'Records', source: null }) p2) {
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
                    handle( @param Sns, @param({ name: 'Records', source: null }) p2) {
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

            invoker({}, {}, (e) => {
                expect(counter).to.equal(1)
                done(e)
            })
        })

        it("serviceParams param", (done) => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'aws'

            @injectable
            class MockInjectable extends Service { }

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

            @injectable
            class MockInjectable extends Service { }

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
    })

    describe("azure", () => {

        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
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

                expect(counter).to.equal(1)
            })

            it("httpTrigger params resolve hint", async () => {
                let counter = 0

                process.env.FUNCTIONAL_ENVIRONMENT = 'azure'
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

        it("inject param", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

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

            const context = {}
            const req = {}

            await invoker(context, req)

            expect(counter).to.equal(1)
        })

        it("serviceParams param", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            @injectable
            class MockInjectable extends Service { }

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

            expect(counter).to.equal(1)
        })

        it("request param", async () => {
            let counter = 0

            process.env.FUNCTIONAL_ENVIRONMENT = 'azure'

            @injectable
            class MockInjectable extends Service { }

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

            expect(counter).to.equal(1)
        })
    })
})