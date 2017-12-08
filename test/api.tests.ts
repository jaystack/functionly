import { expect } from 'chai'
import { FunctionalService, DynamoTable, DocumentClientApi, S3Storage, S3Api } from '../src/classes'
import { injectable, dynamoTable, inject, s3Storage } from '../src/annotations'
import { container } from '../src//helpers/ioc'

describe('api', () => {
    describe('DynamoTable', () => {
        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONAL_STAGE
            delete process.env.DTClass_TABLE_NAME
            delete process.env.DTCLASS_ENV_NAME
            container.clearType(DocumentClientApi)
        })

        it("empty table name", (done) => {
            let counter = 0

            @injectable()
            @dynamoTable()
            class DTClass extends DynamoTable { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.DTClass_TABLE_NAME = 'DTClass-table'
            class Home extends FunctionalService {
                public async handle( @inject(DTClass) a: DTClass) {
                    counter++

                    await a.put({
                        Item: { _id: 1 }
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class DCL extends DocumentClientApi {
                public async init() { }
                public getDocumentClient() {
                    return <any>{
                        put(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Item: { _id: 1 },
                                    TableName: `DTClass-table-customstage`
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(DocumentClientApi, DCL)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("empty table name no env", (done) => {
            let counter = 0

            @injectable()
            @dynamoTable()
            class DTClass extends DynamoTable { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            class Home extends FunctionalService {
                public async handle( @inject(DTClass) a: DTClass) {
                    counter++

                    await a.put({
                        Item: { _id: 1 }
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class DCL extends DocumentClientApi {
                public async init() { }
                public getDocumentClient() {
                    return <any>{
                        put(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Item: { _id: 1 },
                                    TableName: `DTClass-table-customstage`
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(DocumentClientApi, DCL)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("empty table name different env", (done) => {
            let counter = 0

            @injectable()
            @dynamoTable()
            class DTClass extends DynamoTable { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.DTClass_TABLE_NAME = 'DTClass-table-other'
            class Home extends FunctionalService {
                public async handle( @inject(DTClass) a: DTClass) {
                    counter++

                    await a.put({
                        Item: { _id: 1 }
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class DCL extends DocumentClientApi {
                public async init() { }
                public getDocumentClient() {
                    return <any>{
                        put(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Item: { _id: 1 },
                                    TableName: `DTClass-table-other-customstage`
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(DocumentClientApi, DCL)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("custom table name", (done) => {
            let counter = 0

            @injectable()
            @dynamoTable({ tableName: 'ATable' })
            class DTClass extends DynamoTable { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.DTClass_TABLE_NAME = 'ATable'
            class Home extends FunctionalService {
                public async handle( @inject(DTClass) a: DTClass) {
                    counter++

                    await a.put({
                        Item: { _id: 1 }
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class DCL extends DocumentClientApi {
                public async init() { }
                public getDocumentClient() {
                    return <any>{
                        put(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Item: { _id: 1 },
                                    TableName: `ATable-customstage`
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(DocumentClientApi, DCL)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("custom environmentKey", (done) => {
            let counter = 0

            @injectable()
            @dynamoTable({ environmentKey: 'DTCLASS_ENV_NAME' })
            class DTClass extends DynamoTable { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.DTCLASS_ENV_NAME = 'DTClass-table'
            class Home extends FunctionalService {
                public async handle( @inject(DTClass) a: DTClass) {
                    counter++

                    await a.put({
                        Item: { _id: 1 }
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class DCL extends DocumentClientApi {
                public async init() { }
                public getDocumentClient() {
                    return <any>{
                        put(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Item: { _id: 1 },
                                    TableName: `DTClass-table-customstage`
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(DocumentClientApi, DCL)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })
    })

    describe('S3Storage', () => {
        afterEach(() => {
            delete process.env.FUNCTIONAL_ENVIRONMENT
            delete process.env.FUNCTIONAL_STAGE
            delete process.env.S3StorageClass_S3_BUCKET
            delete process.env.S3StorageClass_ENV_NAME
            container.clearType(S3Api)
        })

        it("empty table name", (done) => {
            let counter = 0

            @injectable()
            @s3Storage()
            class S3StorageClass extends S3Storage { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.S3StorageClass_S3_BUCKET = 's3storageclass-bucket'
            class Home extends FunctionalService {
                public async handle( @inject(S3StorageClass) a: S3StorageClass) {
                    counter++

                    await a.getObject({
                        Key: 'a'
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class S3A extends S3Api {
                public async init() { }
                public getS3() {
                    return <any>{
                        getObject(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Key: 'a',
                                    Bucket: 's3storageclass-bucket-customstage'
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(S3Api, S3A)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("empty table name no env", (done) => {
            let counter = 0

            @injectable()
            @s3Storage()
            class S3StorageClass extends S3Storage { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            class Home extends FunctionalService {
                public async handle( @inject(S3StorageClass) a: S3StorageClass) {
                    counter++

                    await a.getObject({
                        Key: 'a'
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class S3A extends S3Api {
                public async init() { }
                public getS3() {
                    return <any>{
                        getObject(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Key: 'a',
                                    Bucket: 's3storageclass-bucket-customstage'
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(S3Api, S3A)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("empty table name different env", (done) => {
            let counter = 0

            @injectable()
            @s3Storage()
            class S3StorageClass extends S3Storage { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.S3StorageClass_S3_BUCKET = 's3storageclass-bucket-custom'
            class Home extends FunctionalService {
                public async handle( @inject(S3StorageClass) a: S3StorageClass) {
                    counter++

                    await a.getObject({
                        Key: 'a'
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class S3A extends S3Api {
                public async init() { }
                public getS3() {
                    return <any>{
                        getObject(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Key: 'a',
                                    Bucket: 's3storageclass-bucket-custom-customstage'
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(S3Api, S3A)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("custom table name", (done) => {
            let counter = 0

            @injectable()
            @s3Storage({ bucketName: 'custom-name' })
            class S3StorageClass extends S3Storage { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.S3StorageClass_S3_BUCKET = 'custom-name'
            class Home extends FunctionalService {
                public async handle( @inject(S3StorageClass) a: S3StorageClass) {
                    counter++

                    await a.getObject({
                        Key: 'a'
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class S3A extends S3Api {
                public async init() { }
                public getS3() {
                    return <any>{
                        getObject(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Key: 'a',
                                    Bucket: 'custom-name-customstage'
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(S3Api, S3A)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })

        it("custom environmentKey", (done) => {
            let counter = 0

            @injectable()
            @s3Storage({ environmentKey: 'S3StorageClass_ENV_NAME' })
            class S3StorageClass extends S3Storage { }

            process.env.FUNCTIONAL_ENVIRONMENT = 'local'
            process.env.FUNCTIONAL_STAGE = 'customstage'
            process.env.S3StorageClass_ENV_NAME = 's3storageclass-other'
            class Home extends FunctionalService {
                public async handle( @inject(S3StorageClass) a: S3StorageClass) {
                    counter++

                    await a.getObject({
                        Key: 'a'
                    })

                    return { ok: 1 }
                }
            }

            @injectable()
            class S3A extends S3Api {
                public async init() { }
                public getS3() {
                    return <any>{
                        getObject(params, cb) {
                            counter++
                            try {
                                expect(params).to.deep.equal({
                                    Key: 'a',
                                    Bucket: 's3storageclass-other-customstage'
                                })
                                cb()
                            } catch (e) {
                                cb(e)
                            }
                        }
                    }
                }
            }

            container.registerType(S3Api, S3A)

            const invoker = Home.createInvoker()
            invoker({}, {
                send: (result) => {
                    expect(counter).to.equal(2)
                    expect(result).to.deep.equal({ ok: 1 })
                    done()
                }
            }, (e) => { e && done(e) })
                .catch((e) => { e && done(e) })
        })
    })
})