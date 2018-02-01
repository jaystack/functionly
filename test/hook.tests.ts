import { expect } from 'chai'
import { FunctionalService, PreHook, PostHook, Resource, DynamoTable, SimpleNotificationService, S3Storage } from '../src/classes'
import { getOverridableMetadata, constants, getMetadata, getFunctionName } from '../src/annotations'
const { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY, CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_SNSCONFIGURATIONKEY, CLASS_S3CONFIGURATIONKEY,
    CLASS_MIDDLEWAREKEY } = constants
import { use, error, result, param, inject, injectable, environment, dynamoTable, sns, s3Storage, functionalServiceName, functionName } from '../src/annotations'


describe('hooks', () => {
    beforeEach(() => {
        process.env.FUNCTIONAL_ENVIRONMENT = 'local'
    })
    afterEach(() => {
        delete process.env.FUNCTIONAL_ENVIRONMENT
    })

    describe('use annotation', () => {
        describe('general', () => {
            it("use", () => {
                class TestHook extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_MIDDLEWAREKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.equal(TestHook)
            })
            it("use multiple param", () => {
                class TestHook1 extends PreHook {
                    public static async handle() { }
                }
                class TestHook2 extends PreHook {
                    public static async handle() { }
                }
                class TestHook3 extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook1, TestHook2, TestHook3)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_MIDDLEWAREKEY, BTestClass)

                expect(value).to.have.lengthOf(3);

                expect(value[0]).to.equal(TestHook1)
                expect(value[1]).to.equal(TestHook2)
                expect(value[2]).to.equal(TestHook3)
            })
            it("multiple use", () => {
                class TestHook1 extends PreHook {
                    public static async handle() { }
                }
                class TestHook2 extends PreHook {
                    public static async handle() { }
                }
                class TestHook3 extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook1)
                @use(TestHook2)
                @use(TestHook3)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_MIDDLEWAREKEY, BTestClass)

                expect(value).to.have.lengthOf(3);

                expect(value[0]).to.equal(TestHook1)
                expect(value[1]).to.equal(TestHook2)
                expect(value[2]).to.equal(TestHook3)
            })
            it("multiple use multiple param", () => {
                class TestHook11 extends PreHook {
                    public static async handle() { }
                }
                class TestHook12 extends PreHook {
                    public static async handle() { }
                }
                class TestHook21 extends PreHook {
                    public static async handle() { }
                }
                class TestHook22 extends PreHook {
                    public static async handle() { }
                }
                class TestHook31 extends PreHook {
                    public static async handle() { }
                }
                class TestHook32 extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook11, TestHook12)
                @use(TestHook21, TestHook22)
                @use(TestHook31, TestHook32)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_MIDDLEWAREKEY, BTestClass)

                expect(value).to.have.lengthOf(6);

                expect(value[0]).to.equal(TestHook11)
                expect(value[1]).to.equal(TestHook12)
                expect(value[2]).to.equal(TestHook21)
                expect(value[3]).to.equal(TestHook22)
                expect(value[4]).to.equal(TestHook31)
                expect(value[5]).to.equal(TestHook32)
            })
        })

        describe('inject on hooks', () => {

            it("functional service inject", () => {
                @injectable()
                class ATestClass extends FunctionalService { }

                class TestHook extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`FUNCTIONAL_SERVICE_${ATestClass.name.toUpperCase()}`, getFunctionName(ATestClass))
            })

            it("service inject", () => {
                @injectable()
                @environment('%ClassName%_defined_environment', 'value')
                class ATestClass extends Resource { }

                class TestHook extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`ATestClass_defined_environment`, 'value')
            });

            it("injected DynamoTable", () => {
                @injectable()
                @dynamoTable({ tableName: 'ATable' })
                class ATestClass extends DynamoTable { }

                class TestHook extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'ATable')
            })

            it("injected SimpleNotificationService", () => {
                @injectable()
                @sns({ topicName: 'ATopic' })
                class ATestClass extends SimpleNotificationService { }

                class TestHook extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_SNSCONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('topicName', 'ATopic')
            })

            it("injected S3Storage", () => {
                @injectable()
                @s3Storage({ bucketName: 'ABucket' })
                class ATestClass extends S3Storage { }

                class TestHook extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 'abucket')
            })
        })

        describe('inject on level2 hooks', () => {

            it("functional service inject", () => {
                @injectable()
                class ATestClass extends FunctionalService { }

                class TestHookLevel2 extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`FUNCTIONAL_SERVICE_${ATestClass.name.toUpperCase()}`, getFunctionName(ATestClass))
            })

            it("service inject", () => {
                @injectable()
                @environment('%ClassName%_defined_environment', 'value')
                class ATestClass extends Resource { }

                class TestHookLevel2 extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`ATestClass_defined_environment`, 'value')
            });

            it("injected DynamoTable", () => {
                @injectable()
                @dynamoTable({ tableName: 'ATable' })
                class ATestClass extends DynamoTable { }

                class TestHookLevel2 extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'ATable')
            })

            it("injected SimpleNotificationService", () => {
                @injectable()
                @sns({ topicName: 'ATopic' })
                class ATestClass extends SimpleNotificationService { }

                class TestHookLevel2 extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_SNSCONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('topicName', 'ATopic')
            })

            it("injected S3Storage", () => {
                @injectable()
                @s3Storage({ bucketName: 'ABucket' })
                class ATestClass extends S3Storage { }

                class TestHookLevel2 extends PreHook {
                    public static async handle( @inject(ATestClass) a) { }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() { }
                }

                @use(TestHook)
                class BTestClass extends FunctionalService {
                    public static async handle() { }
                }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 'abucket')
            })
        })
    })

    describe('usage', () => {

        it('prehook', async () => {
            let counter = 0
            class TestHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook', async () => {
            let counter = 0
            class TestHook extends PostHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook result chain', async () => {
            let counter = 0
            class TestPostHook1 extends PostHook {
                public static async handle( @result result) {
                    counter++

                    return result + 1
                }
            }
            class TestPostHook2 extends PostHook {
                public static async handle( @result result) {
                    counter++

                    return result + 1
                }
            }
            class TestPostHook3 extends PostHook {
                public static async handle( @result result) {
                    counter++

                    return result + 1
                }
            }

            @use(TestPostHook1)
            @use(TestPostHook2)
            @use(TestPostHook3)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)

                    return 10
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(5)

                    expect(result).to.equal(13)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(5)
        })

        it('posthook catch error in service', async () => {
            let counter = 0
            class TestHook extends PostHook {
                public static async catch() {
                    counter++
                    expect(counter).to.equal(2)
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                    throw new Error('error')
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook catch error in service with prehook', async () => {
            let counter = 0
            class TestPreHook extends PostHook {
                public static async catch() {
                    counter++
                    expect(counter).to.equal(1)
                }
            }

            class TestCatchHook extends PostHook {
                public static async catch() {
                    counter++
                    expect(counter).to.equal(3)
                }
            }

            @use(TestPreHook)
            @use(TestCatchHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)
                    throw new Error('error')
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(4)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(4)
        })

        it('posthook catch error in prehook', async () => {
            let counter = 0
            class TestHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                    throw new Error('error')
                }
            }
            class TestCatchHook extends PostHook {
                public static async catch() {
                    counter++
                    expect(counter).to.equal(2)
                }
            }

            @use(TestHook)
            @use(TestCatchHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    expect(true).to.equal(false, 'have to skip this')
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook catch error in posthook', async () => {
            let counter = 0
            class TestHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                }
            }
            class TestCatchHook extends PostHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(3)

                    throw new Error('error')
                }
                public static async catch() {
                    expect(true).to.equal(false, 'have to skip this')
                }
            }

            @use(TestHook)
            @use(TestCatchHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(true).to.equal(false, 'have to skip this')
                }
            }, (e) => {
                counter++
                expect(counter).to.equal(4)
                expect(e.message).to.equal('error')
            })

            expect(counter).to.equal(4)
        })

        it('posthook catch error in posthook handled', async () => {
            let counter = 0
            class TestHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                }
            }
            class TestCatchHook extends PostHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(3)

                    throw new Error('error')
                }
                public static async catch() {
                    expect(true).to.equal(false, 'have to skip this')
                }
            }
            class TestCatchHook2 extends PostHook {
                public static async handle() {
                    expect(true).to.equal(false, 'have to skip this')
                }
                public static async catch() {
                    counter++
                    expect(counter).to.equal(4)

                    return { catch: 1 }
                }
            }

            @use(TestHook)
            @use(TestCatchHook)
            @use(TestCatchHook2)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)

                    return { handle: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(5)
                    expect(result).to.deep.equal({ catch: 1 })
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(5)
        })

        it('decorator resolution in hooks', async () => {
            let counter = 0

            @injectable()
            class AuthHook extends PreHook {
                public static async handle( @param authorization, @param Authorization) {
                    counter++
                    const auth = authorization || Authorization
                    if (!auth) throw new Error('auth')
                    return 'me'
                }
            }
            class PermissionHook extends PreHook {
                public static async handle( @inject(AuthHook) identity) {
                    counter++
                    expect(identity).to.equal('me')
                }
            }
            class ResultHook extends PostHook {
                public static async handle( @result result) {
                    counter++
                    expect(result).to.deep.equal([{ a: 1 }, { a: 2 }, { a: 3 }])
                    return result
                }
                async catch( @error e) {
                    expect(true).to.equal(false, e.message)
                }
            }

            @use(AuthHook)
            @use(PermissionHook)
            @use(ResultHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++

                    return [{ a: 1 }, { a: 2 }, { a: 3 }]
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            const req = {
                headers: { authorization: 'somevalue' }
            }
            await invoker(req, {
                send: (result) => {
                    counter++
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(5)
        })

        describe('hook on hooks', () => {
            it('prehook', async () => {
                let counter = 0

                class TestHookLevel2 extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(1)
                    }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(2)
                    }
                }

                @use(TestHook)
                class TestFunctionalService extends FunctionalService {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(3)
                    }
                }

                const invoker = TestFunctionalService.createInvoker()
                await invoker({}, {
                    send: (result) => {
                        counter++
                        expect(counter).to.equal(4)
                    }
                }, (e) => { expect(true).to.equal(false, e.message) })

                expect(counter).to.equal(4)
            })

            it('posthook', async () => {
                let counter = 0

                class TestHookLevel2 extends PostHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(2)
                    }
                }

                @use(TestHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(1)
                    }
                }

                @use(TestHook)
                class TestFunctionalService extends FunctionalService {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(3)
                    }
                }

                const invoker = TestFunctionalService.createInvoker()
                await invoker({}, {
                    send: (result) => {
                        counter++
                        expect(counter).to.equal(4)
                    }
                }, (e) => { expect(true).to.equal(false, e.message) })

                expect(counter).to.equal(4)
            })

            it('pre-posthook', async () => {
                let counter = 0

                class TestPreHookLevel2 extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(1)
                    }
                }

                class TestPostHookLevel2 extends PostHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(3)
                    }
                }

                @use(TestPreHookLevel2)
                @use(TestPostHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(2)
                    }
                }

                @use(TestHook)
                class TestFunctionalService extends FunctionalService {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(4)
                    }
                }

                const invoker = TestFunctionalService.createInvoker()
                await invoker({}, {
                    send: (result) => {
                        counter++
                        expect(counter).to.equal(5)
                    }
                }, (e) => { expect(true).to.equal(false, e.message) })

                expect(counter).to.equal(5)
            })

            it('pre-posthook pre exception', async () => {
                let counter = 0

                class TestPreHookLevel2 extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(1)

                        throw new Error('error')
                    }
                }

                class TestPostHookLevel2 extends PostHook {
                    public static async handle() {
                        expect(true).to.equal(false, 'have to skip this')
                    }
                }

                @use(TestPreHookLevel2)
                @use(TestPostHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() {
                        expect(true).to.equal(false, 'have to skip this')
                    }
                }

                class TestCatchHook extends PostHook {
                    public static async catch( @error e) {
                        counter++
                        expect(counter).to.equal(2)
                        expect(e.message).to.equal('error')
                    }
                }

                @use(TestHook)
                @use(TestCatchHook)
                class TestFunctionalService extends FunctionalService {
                    public static async handle() {
                        expect(true).to.equal(false, 'have to skip this')
                    }
                }

                const invoker = TestFunctionalService.createInvoker()
                await invoker({}, {
                    send: (result) => {
                        counter++
                        expect(counter).to.equal(3)
                    }
                }, (e) => { expect(true).to.equal(false, e.message) })

                expect(counter).to.equal(3)
            })

            it('pre-posthook exception', async () => {
                let counter = 0

                class TestPreHookLevel2 extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(1)
                    }
                }

                class TestPostHookLevel2 extends PostHook {
                    public static async handle() {
                        expect(true).to.equal(false, 'have to skip this')
                    }
                }

                @use(TestPreHookLevel2)
                @use(TestPostHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(2)

                        throw new Error('error')
                    }
                }

                class TestCatchHook extends PostHook {
                    public static async catch( @error e) {
                        counter++
                        expect(counter).to.equal(3)
                        expect(e.message).to.equal('error')
                    }
                }

                @use(TestHook)
                @use(TestCatchHook)
                class TestFunctionalService extends FunctionalService {
                    public static async handle() {
                        expect(true).to.equal(false, 'have to skip this')
                    }
                }

                const invoker = TestFunctionalService.createInvoker()
                await invoker({}, {
                    send: (result) => {
                        counter++
                        expect(counter).to.equal(4)
                    }
                }, (e) => { expect(true).to.equal(false, e.message) })

                expect(counter).to.equal(4)
            })

            it('pre-posthook post exception', async () => {
                let counter = 0

                class TestPreHookLevel2 extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(1)
                    }
                }

                class TestPostHookLevel2 extends PostHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(3)

                        throw new Error('error')
                    }
                }

                @use(TestPreHookLevel2)
                @use(TestPostHookLevel2)
                class TestHook extends PreHook {
                    public static async handle() {
                        counter++
                        expect(counter).to.equal(2)
                    }
                }

                class TestCatchHook extends PostHook {
                    public static async catch( @error e) {
                        counter++
                        expect(counter).to.equal(4)
                        expect(e.message).to.equal('error')
                    }
                }

                @use(TestHook)
                @use(TestCatchHook)
                class TestFunctionalService extends FunctionalService {
                    public static async handle() {
                        expect(true).to.equal(false, 'have to skip this')
                    }
                }

                const invoker = TestFunctionalService.createInvoker()
                await invoker({}, {
                    send: (result) => {
                        counter++
                        expect(counter).to.equal(5)
                    }
                }, (e) => { expect(true).to.equal(false, e.message) })

                expect(counter).to.equal(5)
            })
        })
    })

    describe('hook decorators', () => {
        it('prehook return => get value', async () => {
            let counter = 0

            @injectable()
            class TestHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                    return 'v1'
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle( @inject(TestHook) p1) {
                    counter++
                    expect(counter).to.equal(2)

                    expect(p1).to.equal('v1')

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('prehook no return => get value', async () => {
            let counter = 0

            @injectable()
            class TestHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle( @inject(TestHook) p1) {
                    counter++
                    expect(counter).to.equal(2)

                    expect(p1).to.null

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook result decorator', async () => {
            let counter = 0

            class TestHook extends PostHook {
                public static async handle( @result res) {
                    counter++
                    expect(counter).to.equal(2)
                    return { ...res, p1: 'p1' }
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1, p1: 'p1' })
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook result decorator return result', async () => {
            let counter = 0

            class TestHook extends PostHook {
                public static async handle( @result res) {
                    counter++
                    expect(counter).to.equal(2)
                    return res
                }
            }

            class TestHook2 extends PostHook {
                public static async catch( @error e) {
                    throw e
                }
            }

            @use(TestHook)
            @use(TestHook2)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it('posthook result decorator no handle', async () => {
            let counter = 0

            class TestHook extends PostHook {
            }

            class TestHook2 extends PostHook {
                public static async catch( @error e) {
                    throw e
                }
            }

            @use(TestHook)
            @use(TestHook2)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                    expect(counter).to.equal(2)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(2)
        })

        it('prehook inject in posthook handle', async () => {
            let counter = 0

            @injectable()
            class TestPreHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                    return 'p1'
                }
            }

            class TestPostHook extends PostHook {
                public static async handle( @result res, @inject(TestPreHook) p1) {
                    counter++
                    expect(counter).to.equal(3)
                    return { ...res, p1 }
                }
            }

            @use(TestPreHook)
            @use(TestPostHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1, p1: 'p1' })
                    counter++
                    expect(counter).to.equal(4)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(4)
        })

        it('prehook inject in posthook catch', async () => {
            let counter = 0

            @injectable()
            class TestPreHook extends PreHook {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(1)
                    return 'p1'
                }
            }

            class TestPostHook extends PostHook {
                public static async catch( @result res, @inject(TestPreHook) p1) {
                    counter++
                    expect(counter).to.equal(3)
                    return { ok: 1, p1 }
                }
            }

            @use(TestPreHook)
            @use(TestPostHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    expect(counter).to.equal(2)

                    throw new Error('error')
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1, p1: 'p1' })
                    counter++
                    expect(counter).to.equal(4)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(4)
        })

        it('multiple prehook set property => get param', async () => {
            let counter = 0

            @injectable()
            class TestHook1 extends PreHook {
                public static async handle() {
                    return 'v1'
                }
            }

            @injectable()
            class TestHook2 extends PreHook {
                public static async handle( @inject(TestHook1) p1) {
                    expect(p1).to.equal('v1')

                    return 'v2'
                }
            }

            @injectable()
            class TestHook3 extends PreHook {
                public static async handle( @inject(TestHook1) p1, @inject(TestHook2) p2) {
                    expect(p1).to.equal('v1')
                    expect(p2).to.equal('v2')

                    return 'v3'
                }
            }

            @use(TestHook1)
            @use(TestHook2)
            @use(TestHook3)
            class TestFunctionalService extends FunctionalService {
                public static async handle( @inject(TestHook1) p1, @inject(TestHook2) p2, @inject(TestHook3) p3) {
                    counter++

                    expect(p1).to.equal('v1')
                    expect(p2).to.equal('v2')
                    expect(p3).to.equal('v3')

                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(2)
        })

        it('@error', async () => {
            let counter = 0
            class TestHook extends PostHook {
                public static async catch( @error e) {
                    counter++
                    expect(e).instanceOf(Error)

                    expect(e.message).to.deep.equal('custom error message')
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    throw new Error('custom error message')
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it("@functionalServiceName", async () => {
            let counter = 0
            class TestHook extends PreHook {
                public static async handle( @functionalServiceName serviceName) {
                    counter++
                    expect(serviceName).to.equal('TestFunctionalService')
                }
            }

            @use(TestHook)
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })

        it("@functionalServiceName with functionName decorator", async () => {
            let counter = 0
            class TestHook extends PreHook {
                public static async handle( @functionalServiceName serviceName) {
                    counter++
                    expect(serviceName).to.equal('MyTestFunctionalService')
                }
            }

            @use(TestHook)
            @functionName('MyTestFunctionalService')
            class TestFunctionalService extends FunctionalService {
                public static async handle() {
                    counter++
                    return { ok: 1 }
                }
            }

            const invoker = TestFunctionalService.createInvoker()
            await invoker({}, {
                send: (result) => {
                    expect(result).to.deep.equal({ ok: 1 })
                    counter++
                    expect(counter).to.equal(3)
                }
            }, (e) => { expect(true).to.equal(false, e.message) })

            expect(counter).to.equal(3)
        })
    })
})