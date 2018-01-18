import 'mocha'
import { expect } from 'chai'

import {
    CLASS_APIGATEWAYKEY, CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_ENVIRONMENTKEY, CLASS_NAMEKEY,
    CLASS_INJECTABLEKEY, CLASS_LOGKEY, CLASS_AWSRUNTIMEKEY, CLASS_AWSMEMORYSIZEKEY, CLASS_AWSTIMEOUTKEY,
    CLASS_S3CONFIGURATIONKEY, CLASS_SNSCONFIGURATIONKEY, CLASS_TAGKEY, CLASS_ROLEKEY, CLASS_DESCRIPTIONKEY,
    PARAMETER_PARAMKEY, CLASS_CLASSCONFIGKEY, CLASS_HTTPTRIGGER, CLASS_AZURENODEKEY, CLASS_CLOUDWATCHEVENT
} from '../src/annotations/constants'
import { applyTemplates, templates } from '../src/annotations/templates'
import { getFunctionParameters } from '../src/annotations/utils'
import { getMetadata, getOverridableMetadata } from '../src/annotations/metadata'
import { expandableDecorator } from '../src/annotations/classes/expandableDecorator'
import { apiGateway } from '../src/annotations/classes/aws/apiGateway'
import { httpTrigger } from '../src/annotations/classes/azure/httpTrigger'
import { rest, httpGet, httpPost, httpPut, httpPatch, httpDelete } from '../src/annotations/classes/rest'
import { dynamoTable, dynamo, __dynamoDBDefaults } from '../src/annotations/classes/dynamoTable'
import { environment } from '../src/annotations/classes/environment'
import { functionName, getFunctionName } from '../src/annotations/classes/functionName'
import { injectable, InjectionScope } from '../src/annotations/classes/injectable'
import { log } from '../src/annotations/classes/log'
import { s3Storage } from '../src/annotations/classes/s3Storage'
import { sns } from '../src/annotations/classes/sns'
import { cloudWatchEvent } from '../src/annotations/classes/aws/cloudWatchEvent'
import { tag } from '../src/annotations/classes/tag'
import { eventSource } from '../src/annotations/classes/eventSource'
import { classConfig } from '../src/annotations/classes/classConfig'
import { role, description } from '../src/annotations'

import { aws } from '../src/annotations/classes/aws/aws'
import { azure } from '../src/annotations/classes/azure/azure'


import { inject } from '../src/annotations/parameters/inject'
import { param, request, serviceParams, createParameterDecorator } from '../src/annotations/parameters/param'
import { FunctionalService, Resource, DynamoTable, SimpleNotificationService, S3Storage, Api, Service } from '../src/classes'



describe('annotations', () => {

    describe("templates", () => {
        class TemplateTestClass { }

        it("simple", () => {

            const { templatedKey, templatedValue } = applyTemplates('key', 'value', TemplateTestClass)

            expect(templatedKey).to.equal('key')
            expect(templatedValue).to.equal('value')
        })
        it("key param", () => {
            const { templatedKey, templatedValue } = applyTemplates('%ClassName%_key', 'value', TemplateTestClass)

            expect(templatedKey).to.equal('TemplateTestClass_key')
            expect(templatedValue).to.equal('value')
        })
        it("value param", () => {
            const { templatedKey, templatedValue } = applyTemplates('key', '%ClassName%_value', TemplateTestClass)

            expect(templatedKey).to.equal('key')
            expect(templatedValue).to.equal('TemplateTestClass_value')
        })
        it("key-value param", () => {
            const { templatedKey, templatedValue } = applyTemplates('%ClassName%_key', '%ClassName%_value', TemplateTestClass)

            expect(templatedKey).to.equal('TemplateTestClass_key')
            expect(templatedValue).to.equal('TemplateTestClass_value')
        })

        describe("custom templates", () => {

            before(() => {
                templates.push({
                    name: 'templateName',
                    regexp: /%myClassName%/g,
                    resolution: (target) => 'my' + target.name
                })
            })

            after(() => {
                templates.length = 1
            })

            it("simple", () => {

                const { templatedKey, templatedValue } = applyTemplates('key', 'value', TemplateTestClass)

                expect(templatedKey).to.equal('key')
                expect(templatedValue).to.equal('value')
            })
            it("key param", () => {
                const { templatedKey, templatedValue } = applyTemplates('%myClassName%_key', 'value', TemplateTestClass)

                expect(templatedKey).to.equal('myTemplateTestClass_key')
                expect(templatedValue).to.equal('value')
            })
            it("value param", () => {
                const { templatedKey, templatedValue } = applyTemplates('key', '%myClassName%_value', TemplateTestClass)

                expect(templatedKey).to.equal('key')
                expect(templatedValue).to.equal('myTemplateTestClass_value')
            })
            it("key-value param", () => {
                const { templatedKey, templatedValue } = applyTemplates('%myClassName%_key', '%myClassName%_value', TemplateTestClass)

                expect(templatedKey).to.equal('myTemplateTestClass_key')
                expect(templatedValue).to.equal('myTemplateTestClass_value')
            })
        })
    })

    describe("utils", () => {
        it("getFunctionParameters", () => {
            class GetFunctionParameterClass {
                method(p1, p2, p3) { }
            }

            const parameters = getFunctionParameters(GetFunctionParameterClass, 'method')

            expect(parameters).to.have.ordered.members(['p1', 'p2', 'p3'])
            expect(parameters).to.be.an('array').that.does.not.include('p4');
        })
    })

    describe("classes", () => {
        describe("expandableDecorator", () => {
            it("interface", () => {
                const mockDecorator = expandableDecorator<{ name: string, p1?: number }>({ name: 'mockDecorator', defaultValues: { p1: 2 } })

                expect(mockDecorator).to.be.a('function')
                expect(mockDecorator).to.have.property('environmentKey', 'functionly:class:mockDecorator')
                expect(mockDecorator).to.have.property('extension').to.be.a('function')
            })
            it("environmentKey", () => {
                const mockDecorator = expandableDecorator<{ name: string, p1?: number }>({ name: 'mockDecorator', defaultValues: { p1: 2 }, environmentKey: 'mockDecorator_environment_key' })

                expect(mockDecorator).to.be.a('function')
                expect(mockDecorator).to.have.property('environmentKey', 'mockDecorator_environment_key')
                expect(mockDecorator).to.have.property('extension').to.be.a('function')
            })
            it("default value", () => {
                const mockDecorator = expandableDecorator<{ name: string, p1?: number }>({ name: 'mockDecorator', defaultValues: { p1: 2 } })

                @mockDecorator({ name: 'n1' })
                class TestClass { }

                const value = getMetadata(mockDecorator.environmentKey, TestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('name', 'n1')
                expect(metadata).to.have.property('p1', 2)
            })
            it("configured value", () => {
                const mockDecorator = expandableDecorator<{ name: string, p1?: number }>({ name: 'mockDecorator', defaultValues: { p1: 2 } })

                @mockDecorator({ name: 'n1', p1: 3 })
                class TestClass { }

                const value = getMetadata(mockDecorator.environmentKey, TestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('name', 'n1')
                expect(metadata).to.have.property('p1', 3)
            })
            describe("extension", () => {
                afterEach(() => {
                    delete process.env.FUNCTIONAL_ENVIRONMENT
                })
                it("environment extension", () => {
                    let counter = 0
                    const mockDecorator = expandableDecorator<{ name: string, p1?: number }>({ name: 'mockDecorator', defaultValues: { p1: 2 } })
                    mockDecorator.extension('custom', (target, config) => {
                        expect(target).to.equal(TestClass)
                        expect(config).to.deep.equal({ name: 'n1', p1: 2 })
                        counter++
                    })

                    process.env.FUNCTIONAL_ENVIRONMENT = 'custom'
                    @mockDecorator({ name: 'n1' })
                    class TestClass { }

                    const value = getMetadata(mockDecorator.environmentKey, TestClass)

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('name', 'n1')
                    expect(metadata).to.have.property('p1', 2)
                    expect(counter).to.equal(1)
                })
            })
        })
        describe("apiGateway", () => {
            it("path", () => {
                @apiGateway({ path: '/v1/test' })
                class ApiGatewayTestClass { }

                const value = getMetadata(CLASS_APIGATEWAYKEY, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.property('method', 'get')
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('authorization', 'AWS_IAM')
            })
            it("method", () => {
                @apiGateway({ path: '/v1/test', method: 'post' })
                class ApiGatewayTestClass { }

                const value = getMetadata(CLASS_APIGATEWAYKEY, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.property('method', 'post')
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('authorization', 'AWS_IAM')
            })
            it("cors", () => {
                @apiGateway({ path: '/v1/test', cors: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(CLASS_APIGATEWAYKEY, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.property('method', 'get')
                expect(metadata).to.have.property('cors', true)
                expect(metadata).to.have.property('authorization', 'AWS_IAM')
            })
            it("corsConfig", () => {
                @apiGateway({ path: '/v1/test', cors: true, corsConfig: { headers: ['X-test'] } })
                class ApiGatewayTestClass { }

                const value = getMetadata(CLASS_APIGATEWAYKEY, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.property('method', 'get')
                expect(metadata).to.have.property('cors', true)
                expect(metadata).to.have.deep.property('corsConfig', { headers: ['X-test'] })
                expect(metadata).to.have.property('authorization', 'AWS_IAM')
            })
            it("authorization", () => {
                @apiGateway({ path: '/v1/test', authorization: 'NONE' })
                class ApiGatewayTestClass { }

                const value = getMetadata(CLASS_APIGATEWAYKEY, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.property('method', 'get')
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('authorization', 'NONE')
            })
        })
        describe("httpTrigger", () => {
            it("path", () => {
                @httpTrigger({ route: '/v1/test' })
                class HttpTriggerTestClass { }

                const value = getMetadata(CLASS_HTTPTRIGGER, HttpTriggerTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('route', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('authLevel', 'function')
            })
            it("method", () => {
                @httpTrigger({ route: '/v1/test', methods: ['post'] })
                class HttpTriggerTestClass { }

                const value = getMetadata(CLASS_HTTPTRIGGER, HttpTriggerTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('route', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['post'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('authLevel', 'function')
            })
            it("cors", () => {
                @httpTrigger({ route: '/v1/test', cors: true })
                class HttpTriggerTestClass { }

                const value = getMetadata(CLASS_HTTPTRIGGER, HttpTriggerTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('route', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', true)
                expect(metadata).to.have.property('authLevel', 'function')
            })

            it("corsConfig", () => {
                @httpTrigger({ route: '/v1/test', cors: true, corsConfig: { headers: ['X-test'] } })
                class HttpTriggerTestClass { }

                const value = getMetadata(CLASS_HTTPTRIGGER, HttpTriggerTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('route', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', true)
                expect(metadata).to.have.deep.property('corsConfig', { headers: ['X-test'] })
                expect(metadata).to.have.property('authLevel', 'function')
            })
            it("authorization", () => {
                @httpTrigger({ route: '/v1/test', authLevel: 'anonymous' })
                class HttpTriggerTestClass { }

                const value = getMetadata(CLASS_HTTPTRIGGER, HttpTriggerTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]


                expect(metadata).to.have.property('route', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('authLevel', 'anonymous')
            })
        })
        describe("rest", () => {
            it("path", () => {
                @rest({ path: '/v1/test' })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("method", () => {
                @rest({ path: '/v1/test', methods: ['post'] })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['post'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("cors", () => {
                @rest({ path: '/v1/test', cors: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', true)
                expect(metadata).to.have.property('anonymous', false)
            })

            it("corsConfig", () => {
                @rest({ path: '/v1/test', cors: true, corsConfig: { headers: ['X-test'] } })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', true)
                expect(metadata).to.have.deep.property('corsConfig', { headers: ['X-test'] })
                expect(metadata).to.have.property('anonymous', false)
            })
            it("authorization", () => {
                @rest({ path: '/v1/test', anonymous: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', true)
            })
        })
        describe("httpGet", () => {
            it("path", () => {
                @httpGet('/v1/test')
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("config", () => {
                @httpGet({ path: '/v1/test', anonymous: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['get'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', true)
            })
        })
        describe("httpPost", () => {
            it("path", () => {
                @httpPost('/v1/test')
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['post'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("config", () => {
                @httpPost({ path: '/v1/test', anonymous: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['post'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', true)
            })
        })
        describe("httpPut", () => {
            it("path", () => {
                @httpPut('/v1/test')
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['put'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("config", () => {
                @httpPut({ path: '/v1/test', anonymous: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['put'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', true)
            })
        })
        describe("httpPatch", () => {
            it("path", () => {
                @httpPatch('/v1/test')
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['patch'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("config", () => {
                @httpPatch({ path: '/v1/test', anonymous: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['patch'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', true)
            })
        })
        describe("httpDelete", () => {
            it("path", () => {
                @httpDelete('/v1/test')
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['delete'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', false)
            })
            it("config", () => {
                @httpDelete({ path: '/v1/test', anonymous: true })
                class ApiGatewayTestClass { }

                const value = getMetadata(rest.environmentKey, ApiGatewayTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('path', '/v1/test')
                expect(metadata).to.have.deep.property('methods', ['delete'])
                expect(metadata).to.have.property('cors', false)
                expect(metadata).to.have.property('anonymous', true)
            })
        })
        describe("dynamoTable", () => {
            it("no param", () => {
                @dynamoTable()
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'DynamoTableTestClass-table')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("empty", () => {
                @dynamoTable({})
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'DynamoTableTestClass-table')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("tableName", () => {
                @dynamoTable({ tableName: 'mytablename' })
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'mytablename')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("environmentKey", () => {
                @dynamoTable({ tableName: 'mytablename', environmentKey: 'myenvkey' })
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'mytablename')
                expect(metadata).to.have.property('environmentKey', 'myenvkey')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("nativeConfig", () => {
                @dynamoTable({
                    tableName: 'mytablename', nativeConfig: {
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 4,
                            WriteCapacityUnits: 4
                        }
                    }
                })
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'mytablename')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal({
                    ...__dynamoDBDefaults,
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 4,
                        WriteCapacityUnits: 4
                    }
                });
            })
        })
        describe("dynamo", () => {
            it("no param", () => {
                @dynamo()
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'DynamoTableTestClass-table')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("empty", () => {
                @dynamo({})
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'DynamoTableTestClass-table')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("tableName", () => {
                @dynamo({ tableName: 'mytablename' })
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'mytablename')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("environmentKey", () => {
                @dynamo({ tableName: 'mytablename', environmentKey: 'myenvkey' })
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'mytablename')
                expect(metadata).to.have.property('environmentKey', 'myenvkey')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal(__dynamoDBDefaults);
            })
            it("nativeConfig", () => {
                @dynamo({
                    tableName: 'mytablename', nativeConfig: {
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 4,
                            WriteCapacityUnits: 4
                        }
                    }
                })
                class DynamoTableTestClass { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, DynamoTableTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'mytablename')
                expect(metadata).to.have.property('environmentKey', 'DynamoTableTestClass_TABLE_NAME')
                expect(metadata).to.have.property('definedBy', DynamoTableTestClass.name)
                expect(metadata).to.have.deep.property('nativeConfig').that.deep.equal({
                    ...__dynamoDBDefaults,
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 4,
                        WriteCapacityUnits: 4
                    }
                });
            })
        })
        describe("environment", () => {
            it("key - value", () => {
                @environment('key', 'value')
                @environment('key2', 'value2')
                class EnvironmentTestClass { }

                const metadata = getMetadata(CLASS_ENVIRONMENTKEY, EnvironmentTestClass)

                expect(metadata).to.have.all.keys('key', 'key2')
                expect(metadata).to.have.property('key', 'value')
                expect(metadata).to.have.property('key2', 'value2')
                expect(metadata).to.not.have.property('key3')
            })
            it("template", () => {
                @environment('%ClassName%_env', 'value')
                @environment('key', '%ClassName%_value')
                @environment('%ClassName%_env2', '%ClassName%_value2')
                class EnvironmentTestClass { }

                const metadata = getMetadata(CLASS_ENVIRONMENTKEY, EnvironmentTestClass)

                expect(metadata).to.have.all.keys('EnvironmentTestClass_env', 'key', 'EnvironmentTestClass_env2')
                expect(metadata).to.have.property('EnvironmentTestClass_env', 'value')
                expect(metadata).to.have.property('key', 'EnvironmentTestClass_value')
                expect(metadata).to.have.property('EnvironmentTestClass_env2', 'EnvironmentTestClass_value2')
            })
        })
        describe("functionName", () => {
            it("metadata", () => {
                @functionName('fnName')
                class FunctionNameTestClass { }

                const name = getMetadata(CLASS_NAMEKEY, FunctionNameTestClass)

                expect(name).to.equal('fnName')
            })
            it("functionName", () => {
                class FunctionNameTestClass { }

                const name = getFunctionName(FunctionNameTestClass)

                expect(name).to.equal(FunctionNameTestClass.name)
            })
            it("attribute", () => {
                @functionName('fnName')
                class FunctionNameTestClass { }

                const name = getFunctionName(FunctionNameTestClass)

                expect(name).to.equal('fnName')
            })
            it("instance functionName", () => {
                class FunctionNameTestClass { }

                const name = getFunctionName(new FunctionNameTestClass())

                expect(name).to.equal(FunctionNameTestClass.name)
            })
            it("instance attribute", () => {
                @functionName('fnName')
                class FunctionNameTestClass { }

                const name = getFunctionName(new FunctionNameTestClass())

                expect(name).to.equal('fnName')
            })
        })
        describe("injectable", () => {
            it("injectable", () => {
                @injectable()
                class InjectableTestClass { }

                const value = getMetadata(CLASS_INJECTABLEKEY, InjectableTestClass)

                expect(value).to.equal(1)
            })
            it("injectable", () => {
                @injectable(InjectionScope.Transient)
                class InjectableTestClass { }

                const value = getMetadata(CLASS_INJECTABLEKEY, InjectableTestClass)

                expect(value).to.equal(1)
            })
            it("injectable", () => {
                @injectable(InjectionScope.Singleton)
                class InjectableTestClass { }

                const value = getMetadata(CLASS_INJECTABLEKEY, InjectableTestClass)

                expect(value).to.equal(2)
            })
            it("non injectable", () => {
                class InjectableTestClass { }

                const value = getMetadata(CLASS_INJECTABLEKEY, InjectableTestClass)

                expect(value).to.undefined
            })
        })
        describe("log", () => {
            it("log", () => {
                @log()
                class LogTestClass { }

                const value = getMetadata(CLASS_LOGKEY, LogTestClass)

                expect(value).to.equal(true)
            })
            it("non log", () => {
                class LogTestClass { }

                const value = getMetadata(CLASS_LOGKEY, LogTestClass)

                expect(value).to.undefined
            })
        })
        describe("s3Storage", () => {
            it("no param", () => {
                @s3Storage()
                class S3StorageTestClass { }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, S3StorageTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 's3storagetestclass-bucket')
                expect(metadata).to.have.property('environmentKey', 'S3StorageTestClass_S3_BUCKET')
                expect(metadata).to.have.property('definedBy', S3StorageTestClass.name)
                expect(metadata).to.not.have.property('eventSourceConfiguration')
            })
            it("empty", () => {
                @s3Storage({})
                class S3StorageTestClass { }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, S3StorageTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 's3storagetestclass-bucket')
                expect(metadata).to.have.property('environmentKey', 'S3StorageTestClass_S3_BUCKET')
                expect(metadata).to.have.property('definedBy', S3StorageTestClass.name)
                expect(metadata).to.not.have.property('eventSourceConfiguration')
            })
            it("bucketName", () => {
                @s3Storage({ bucketName: 'mybucketname' })
                class S3StorageTestClass { }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, S3StorageTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 'mybucketname')
                expect(metadata).to.have.property('environmentKey', 'S3StorageTestClass_S3_BUCKET')
                expect(metadata).to.have.property('definedBy', S3StorageTestClass.name)
                expect(metadata).to.not.have.property('eventSourceConfiguration')
            })
            it("bucketName LowerCase", () => {
                @s3Storage({ bucketName: 'myBucketName' })
                class S3StorageTestClass { }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, S3StorageTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName').that.not.equal('myBucketName')
                expect(metadata).to.have.property('bucketName', 'mybucketname')
                expect(metadata).to.have.property('environmentKey', 'S3StorageTestClass_S3_BUCKET')
                expect(metadata).to.have.property('definedBy', S3StorageTestClass.name)
                expect(metadata).to.not.have.property('eventSourceConfiguration')
            })
            it("environmentKey", () => {
                @s3Storage({ bucketName: 'mybucketname', environmentKey: 'myenvkey' })
                class S3StorageTestClass { }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, S3StorageTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 'mybucketname')
                expect(metadata).to.have.property('environmentKey', 'myenvkey')
                expect(metadata).to.have.property('definedBy', S3StorageTestClass.name)
                expect(metadata).to.not.have.property('eventSourceConfiguration')
            })
            it("eventSourceConfiguration", () => {
                @s3Storage({
                    bucketName: 'mybucketname',
                    eventSourceConfiguration: {
                        Event: 'eventName',
                        Filter: {}
                    }
                })
                class S3StorageTestClass { }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, S3StorageTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 'mybucketname')
                expect(metadata).to.have.property('environmentKey', 'S3StorageTestClass_S3_BUCKET')
                expect(metadata).to.have.property('definedBy', S3StorageTestClass.name)
                expect(metadata).to.have.deep.property('eventSourceConfiguration').that.deep.equal({
                    Event: 'eventName',
                    Filter: {}
                });
            })
        })
        describe("sns", () => {
            it("no parm", () => {
                @sns()
                class SNSTestClass { }

                const value = getMetadata(CLASS_SNSCONFIGURATIONKEY, SNSTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('topicName', 'SNSTestClass-topic')
                expect(metadata).to.have.property('environmentKey', 'SNSTestClass_SNS_TOPICNAME')
                expect(metadata).to.have.property('definedBy', SNSTestClass.name)
            })
            it("topicName", () => {
                @sns({})
                class SNSTestClass { }

                const value = getMetadata(CLASS_SNSCONFIGURATIONKEY, SNSTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('topicName', 'SNSTestClass-topic')
                expect(metadata).to.have.property('environmentKey', 'SNSTestClass_SNS_TOPICNAME')
                expect(metadata).to.have.property('definedBy', SNSTestClass.name)
            })
            it("topicName", () => {
                @sns({ topicName: 'myTopicName' })
                class SNSTestClass { }

                const value = getMetadata(CLASS_SNSCONFIGURATIONKEY, SNSTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('topicName', 'myTopicName')
                expect(metadata).to.have.property('environmentKey', 'SNSTestClass_SNS_TOPICNAME')
                expect(metadata).to.have.property('definedBy', SNSTestClass.name)
            })
            it("environmentKey", () => {
                @sns({ topicName: 'myTopicName', environmentKey: 'myenvkey' })
                class SNSTestClass { }

                const value = getMetadata(CLASS_SNSCONFIGURATIONKEY, SNSTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('topicName', 'myTopicName')
                expect(metadata).to.have.property('environmentKey', 'myenvkey')
                expect(metadata).to.have.property('definedBy', SNSTestClass.name)
            })
        })
        describe("scheduleEvent", () => {
            it("missing config", () => {
                @cloudWatchEvent({})
                class ScheduleEventTestClass { }

                const value = getMetadata(CLASS_CLOUDWATCHEVENT, ScheduleEventTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.not.have.property('scheduleExpression')
                expect(metadata).to.not.have.property('eventPattern')
                expect(metadata).to.have.property('definedBy', ScheduleEventTestClass.name)
            })
            it("scheduleExpression", () => {
                @cloudWatchEvent({ scheduleExpression: 'rate(10 minutes)' })
                class ScheduleEventTestClass { }

                const value = getMetadata(CLASS_CLOUDWATCHEVENT, ScheduleEventTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('scheduleExpression', 'rate(10 minutes)')
                expect(metadata).to.not.have.property('eventPattern')
                expect(metadata).to.have.property('definedBy', ScheduleEventTestClass.name)
            })
            it("eventPattern", () => {
                @cloudWatchEvent({ eventPattern: {} })
                class ScheduleEventTestClass { }

                const value = getMetadata(CLASS_CLOUDWATCHEVENT, ScheduleEventTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.not.have.property('scheduleExpression')
                expect(metadata).to.have.deep.property('eventPattern', {})
                expect(metadata).to.have.property('definedBy', ScheduleEventTestClass.name)
            })
            it("scheduleExpression and eventPattern", () => {
                @cloudWatchEvent({ scheduleExpression: 'rate(10 minutes)', eventPattern: {} })
                class ScheduleEventTestClass { }

                const value = getMetadata(CLASS_CLOUDWATCHEVENT, ScheduleEventTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('scheduleExpression', 'rate(10 minutes)')
                expect(metadata).to.have.deep.property('eventPattern', {})
                expect(metadata).to.have.property('definedBy', ScheduleEventTestClass.name)
            })
        })
        describe("tag", () => {
            it("key - value", () => {
                @tag('key', 'value')
                @tag('key2', 'value2')
                class TagTestClass { }

                const metadata = getMetadata(CLASS_TAGKEY, TagTestClass)

                expect(metadata).to.have.all.keys('key', 'key2')
                expect(metadata).to.have.property('key', 'value')
                expect(metadata).to.have.property('key2', 'value2')
                expect(metadata).to.not.have.property('key3')
            })
        })
        describe("role", () => {
            it("role", () => {
                @role('rolename')
                class RoleTestClass { }

                const roleValue = getMetadata(CLASS_ROLEKEY, RoleTestClass)

                expect(roleValue).to.equal('rolename')
            })
        })
        describe("description", () => {
            it("description", () => {
                @description('desc...')
                class DescriptionTestClass { }

                const descriptionValue = getMetadata(CLASS_DESCRIPTIONKEY, DescriptionTestClass)

                expect(descriptionValue).to.equal('desc...')
            })
        })
        describe("classConfig", () => {
            it("classConfig", () => {
                @classConfig({ customValue: 'v1' })
                class EventSourceTestClass { }

                const config = getMetadata(CLASS_CLASSCONFIGKEY, EventSourceTestClass)

                expect(config).to.deep.equal({ customValue: 'v1' })
            })

            it("classConfig inherited", () => {
                @classConfig({ customValue: 'v1' })
                class ClassConfigTestClass { }

                class ClassConfigTestClassInherited extends ClassConfigTestClass { }

                const config = getMetadata(CLASS_CLASSCONFIGKEY, ClassConfigTestClassInherited)

                expect(config).to.deep.equal({ customValue: 'v1' })
            })

            it("classConfig extended", () => {
                @classConfig({ customValue: 'v1' })
                class ClassConfigTestClass { }

                @classConfig({ customValue2: 'v2' })
                class ClassConfigTestClassInherited extends ClassConfigTestClass { }

                const config = getMetadata(CLASS_CLASSCONFIGKEY, ClassConfigTestClassInherited)

                expect(config).to.deep.equal({ customValue: 'v1', customValue2: 'v2' })
            })

            it("classConfig override", () => {
                @classConfig({ customValue: 'v1' })
                class ClassConfigTestClass { }

                @classConfig({ customValue: 'v2' })
                class ClassConfigTestClassInherited extends ClassConfigTestClass { }

                const config = getMetadata(CLASS_CLASSCONFIGKEY, ClassConfigTestClassInherited)

                expect(config).to.deep.equal({ customValue: 'v2' })
            })
        })
        describe("eventSource", () => {
            it("eventSource", () => {
                let counter = 0

                class ATestClass {
                    public static toEventSource(target: Function, definitionConfig: any) {
                        counter++
                    }
                }

                @eventSource(ATestClass)
                class BTestClass { }

                expect(counter).to.equal(1)
            })

            it("multiple eventSource", () => {
                let counter = 0

                class ATestClass {
                    public static toEventSource(target: Function) {
                        counter++
                    }
                }

                class AATestClass extends ATestClass {
                    public static toEventSource(target: Function) {
                        counter++
                    }
                }

                @eventSource(ATestClass)
                @eventSource(AATestClass)
                @eventSource(AATestClass)
                class BTestClass { }

                expect(counter).to.equal(3)
            })

            it("multiple eventSource single definition", () => {
                let counter = 0

                class ATestClass {
                    public static toEventSource(target: Function) {
                        counter++
                    }
                }

                class AATestClass extends ATestClass {
                    public static toEventSource(target: Function) {
                        counter++
                    }
                }

                @eventSource(ATestClass, AATestClass, AATestClass)
                class BTestClass { }

                expect(counter).to.equal(3)
            })

            it("eventSource inject service", () => {
                @dynamoTable({ tableName: 't1' })
                @classConfig({ injectServiceEventSourceKey: CLASS_DYNAMOTABLECONFIGURATIONKEY })
                class ATestClass extends Api { }

                @eventSource(ATestClass)
                class BTestClass extends FunctionalService { }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 't1')
                expect(metadata).to.have.property('eventSource', true)
            })
        })
        describe("aws", () => {
            it("type", () => {
                @aws({ type: 'nodejs6.10' })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_AWSRUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_AWSMEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_AWSTIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.equal('nodejs6.10')
                expect(memoryValue).to.undefined
                expect(timeoutValue).to.undefined
            })
            it("memorySize", () => {
                @aws({ memorySize: 100 })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_AWSRUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_AWSMEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_AWSTIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.undefined
                expect(memoryValue).to.equal(100)
                expect(timeoutValue).to.undefined
            })
            it("timeout", () => {
                @aws({ timeout: 3 })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_AWSRUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_AWSMEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_AWSTIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.undefined
                expect(memoryValue).to.undefined
                expect(timeoutValue).to.equal(3)
            })
            it("all", () => {
                @aws({ type: 'nodejs6.10', memorySize: 100, timeout: 3 })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_AWSRUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_AWSMEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_AWSTIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.equal('nodejs6.10')
                expect(memoryValue).to.equal(100)
                expect(timeoutValue).to.equal(3)
            })
        })
        describe("azure", () => {
            it("node", () => {
                @azure({ node: '6.5.0' })
                class RuntimeTestClass { }

                const nodeValue = getMetadata(CLASS_AZURENODEKEY, RuntimeTestClass)

                expect(nodeValue).to.equal('6.5.0')
            })
        })
    })

    describe("parameters", () => {
        describe("inject", () => {
            it("inject", () => {
                @injectable()
                class ATestClass { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')
            })

            it("functional service inject", () => {
                @injectable()
                class ATestClass extends FunctionalService { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`FUNCTIONAL_SERVICE_${ATestClass.name.toUpperCase()}`, getFunctionName(ATestClass))
            })

            it("resource inject", () => {
                @injectable()
                @environment('%ClassName%_defined_environment', 'value')
                class ATestClass extends Resource { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`ATestClass_defined_environment`, 'value')
            })

            it("injected DynamoTable", () => {
                @injectable()
                @dynamoTable({ tableName: 'ATable' })
                class ATestClass extends DynamoTable { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
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
                class BTestClass {
                    method( @inject(ATestClass) a) { }
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
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getMetadata(CLASS_S3CONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('bucketName', 'abucket')
            })

            it("overrided class method", () => {
                @injectable()
                class ATestClass { }

                class BaseBTestClass {
                    method( @inject(ATestClass) p1, @inject(ATestClass) p2) { }
                }
                class BTestClass extends BaseBTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')
            })

            it("overrided class method no inject", () => {
                @injectable()
                class ATestClass { }

                class BaseBTestClass {
                    method( @inject(ATestClass) p1, @inject(ATestClass) p2) { }
                }
                class BTestClass extends BaseBTestClass {
                    method() { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')
                expect(value).to.undefined
            })

            it("not overrided class method", () => {
                @injectable()
                class ATestClass { }

                class BaseBTestClass {
                    method( @inject(ATestClass) a) { }
                }
                class BTestClass extends BaseBTestClass {

                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')
            })

            it("service inject", () => {
                @injectable()
                @environment('%ClassName%_defined_environment', 'value')
                class ATestClass extends Service { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`ATestClass_defined_environment`, 'value')
            })
        })
        describe("param", () => {
            it("param", () => {
                class ParamClass {
                    method( @param name) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'name')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
            })
            it("custom name", () => {
                class ParamClass {
                    method( @param('fullName') name) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'fullName')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
            })
            it("param index", () => {
                class ParamClass {
                    method( @param name, @param fullName) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(2);

                const matadata1 = value[0]

                expect(matadata1).to.have.property('from', 'fullName')
                expect(matadata1).to.have.property('parameterIndex', 1)
                expect(matadata1).to.have.property('type', 'param')

                const matadata2 = value[1]

                expect(matadata2).to.have.property('from', 'name')
                expect(matadata2).to.have.property('parameterIndex', 0)
                expect(matadata2).to.have.property('type', 'param')
            })
            it("with config", () => {
                class ParamClass {
                    method( @param({ name: 'fullName', p1: 1, p2: 'p2' }) name) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'fullName')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
                expect(metadata).to.have.property('p1', 1)
                expect(metadata).to.have.property('p2', 'p2')
            })
            it("with config without name", () => {
                class ParamClass {
                    method( @param({ p1: 1, p2: 'p2' }) shortName) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'shortName')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
                expect(metadata).to.have.property('p1', 1)
                expect(metadata).to.have.property('p2', 'p2')
            })

            describe('createParameterDecorator', () => {
                it("inject", () => {

                    const myDecorator = createParameterDecorator('myDecorator')

                    class ParamClass {
                        method( @myDecorator p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'myDecorator')
                })
                it("inject call", () => {

                    const myDecorator = createParameterDecorator('myDecorator')

                    class ParamClass {
                        method( @myDecorator() p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'myDecorator')
                })
                it("inject default config", () => {
                    const defaultConfig = { c: 1 }
                    const myDecorator = createParameterDecorator('myDecorator', defaultConfig)

                    class ParamClass {
                        method( @myDecorator p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'myDecorator')
                    expect(metadata).to.have.property('config').that.deep.equal(defaultConfig)
                })
                it("inject call default config", () => {
                    const defaultConfig = { c: 1 }
                    const myDecorator = createParameterDecorator('myDecorator', defaultConfig)

                    class ParamClass {
                        method( @myDecorator() p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'myDecorator')
                    expect(metadata).to.have.property('config').that.deep.equal(defaultConfig)
                })
                it("inject config", () => {
                    const defaultConfig = { c: 1 }
                    const myDecorator = createParameterDecorator('myDecorator', defaultConfig)

                    class ParamClass {
                        method( @myDecorator({ d: 3 }) p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'myDecorator')
                    expect(metadata).to.have.property('config').that.deep.equal({ c: 1, d: 3 })
                })
                it("inject config override", () => {
                    const defaultConfig = { c: 1 }
                    const myDecorator = createParameterDecorator('myDecorator', defaultConfig)

                    class ParamClass {
                        method( @myDecorator({ c: 2 }) p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'myDecorator')
                    expect(metadata).to.have.property('config').that.deep.equal({ c: 2 })
                })
            })

            describe('request', () => {
                it("inject", () => {
                    class ParamClass {
                        method( @request p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'request')
                })
                it("inject call", () => {
                    class ParamClass {
                        method( @request() p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'request')
                })
            })

            describe('serviceParams', () => {
                it("inject", () => {
                    class ParamClass {
                        method( @serviceParams p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'serviceParams')
                })
                it("inject call", () => {
                    class ParamClass {
                        method( @serviceParams() p1) { }
                    }

                    const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                    expect(value).to.have.lengthOf(1);

                    const metadata = value[0]

                    expect(metadata).to.have.property('from', 'p1')
                    expect(metadata).to.have.property('parameterIndex', 0)
                    expect(metadata).to.have.property('type', 'serviceParams')
                })
            })

            it("overrided class method", () => {

                class BaseParamClass {
                    method( @param p1, @param p2) { }
                }

                class ParamClass extends BaseParamClass {
                    method( @param name) { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'name')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
            })

            it("overrided class method no param", () => {

                class BaseParamClass {
                    method( @param p1, @param p2) { }
                }

                class ParamClass extends BaseParamClass {
                    method() { }
                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')
                expect(value).to.undefined
            })

            it("not overrided class method", () => {

                class BaseParamClass {
                    method( @param name) { }
                }

                class ParamClass extends BaseParamClass {

                }

                const value = getOverridableMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'name')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
            })
        })
    })

    describe("service inject", () => {
        it("environment param", () => {

            @environment('p1', 'v1')
            @injectable()
            class Service1 extends Service {
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, FSTest1)

            expect(environmentMetadata).to.have.property('p1', 'v1')
        })

        it("dynamo param", () => {
            @dynamo({ tableName: 't1', nativeConfig: { any: 'value' } })
            @injectable()
            class DTable1 extends DynamoTable { }

            @injectable()
            class Service1 extends Service {
                public async handle( @inject(DTable1) table1) { }
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, FSTest1)

            expect(value).to.be.not.undefined;
            expect(value).to.have.lengthOf(1);

            const metadata = value[0]

            expect(metadata).to.have.property('tableName', 't1')
            expect(metadata).to.have.property('nativeConfig').to.have.property('any', 'value')
        })

        it("dynamo param", () => {
            @dynamoTable({ tableName: 't1', nativeConfig: { any: 'value' } })
            @injectable()
            class DTable1 extends DynamoTable { }

            @injectable()
            class Service1 extends Service {
                public async handle( @inject(DTable1) table1) { }
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, FSTest1)

            expect(value).to.be.not.undefined;
            expect(value).to.have.lengthOf(1);

            const metadata = value[0]

            expect(metadata).to.have.property('tableName', 't1')
            expect(metadata).to.have.property('nativeConfig').to.have.property('any', 'value')
        })

        it("s3 param", () => {
            @s3Storage({ bucketName: 's3-bucket' })
            @injectable()
            class S3Storage1 extends S3Storage { }

            @injectable()
            class Service1 extends Service {
                public async handle( @inject(S3Storage1) s1) { }
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const value = getMetadata(CLASS_S3CONFIGURATIONKEY, FSTest1)

            expect(value).to.be.not.undefined;
            expect(value).to.have.lengthOf(1);

            const metadata = value[0]

            expect(metadata).to.have.property('bucketName', 's3-bucket')
        })

        it("dynamo param from api", () => {
            @dynamoTable({ tableName: 't1', nativeConfig: { any: 'value' } })
            @injectable()
            class DTable1 extends DynamoTable { }

            @injectable()
            class Api1 extends Api {
                public constructor( @inject(DTable1) private table1) { super() }
            }

            @injectable()
            class Service1 extends Service {
                public async handle( @inject(Api1) a1) { }
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, FSTest1)

            expect(value).to.be.not.undefined;
            expect(value).to.have.lengthOf(1);

            const metadata = value[0]

            expect(metadata).to.have.property('tableName', 't1')
            expect(metadata).to.have.property('nativeConfig').to.have.property('any', 'value')
        })

        it("dynamo param from api and service", () => {
            @dynamoTable({ tableName: 't1', nativeConfig: { any: 'value' } })
            @injectable()
            class DTable1 extends DynamoTable { }

            @injectable()
            class Api1 extends Api {
                public constructor( @inject(DTable1) private table1) { super() }
            }

            @injectable()
            class Service1 extends Service {
                public async handle( @inject(Api1) a1, @inject(DTable1) table1) { }
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, FSTest1)

            expect(value).to.be.not.undefined;
            expect(value).to.have.lengthOf(2);

            const metadata1 = value[0]

            expect(metadata1).to.have.property('tableName', 't1')
            expect(metadata1).to.have.property('nativeConfig').to.have.property('any', 'value')

            const metadata2 = value[1]

            expect(metadata2).to.have.property('tableName', 't1')
            expect(metadata2).to.have.property('nativeConfig').to.have.property('any', 'value')
        })

        it("dynamo param from api and service different", () => {
            @dynamoTable({ tableName: 't1', nativeConfig: { any: 'value1' } })
            @injectable()
            class DTable1 extends DynamoTable { }

            @dynamoTable({ tableName: 't2', nativeConfig: { any: 'value2' } })
            @injectable()
            class DTable2 extends DynamoTable { }

            @injectable()
            class Api1 extends Api {
                public constructor( @inject(DTable1) private table1) { super() }
            }

            @injectable()
            class Service1 extends Service {
                public async handle( @inject(Api1) a1, @inject(DTable2) table2) { }
            }

            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }

            const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, FSTest1)

            expect(value).to.be.not.undefined;
            expect(value).to.have.lengthOf(2);

            const metadata1 = value[0]
            expect(metadata1).to.have.property('tableName', 't2')
            expect(metadata1).to.have.property('nativeConfig').to.have.property('any', 'value2')

            const metadata2 = value[1]
            expect(metadata2).to.have.property('tableName', 't1')
            expect(metadata2).to.have.property('nativeConfig').to.have.property('any', 'value1')
        })

        it("environment variable chain", () => {
            @environment('p1', 'v1')
            @injectable()
            class Api2 extends Api { }

            @injectable()
            @environment('p2', 'v2')
            class Api1 extends Api {
                public constructor( @inject(Api2) private a2) { super() }
            }

            @injectable()
            @environment('p3', 'v3')
            class Service1 extends Service {
                public async handle( @inject(Api1) a1) { }
            }

            @environment('p4', 'v4')
            class FSTest1 extends FunctionalService {
                public async handle( @inject(Service1) s1) { }
            }


            const api2Env = getMetadata(CLASS_ENVIRONMENTKEY, Api2)
            expect(api2Env).to.have.all.keys('p1');
            expect(api2Env).to.deep.equal({
                p1: 'v1',
            })

            const api1Env = getMetadata(CLASS_ENVIRONMENTKEY, Api1)
            expect(api1Env).to.have.all.keys('p1', 'p2');
            expect(api1Env).to.deep.equal({
                p1: 'v1',
                p2: 'v2',
            })

            const service1Env = getMetadata(CLASS_ENVIRONMENTKEY, Service1)
            expect(service1Env).to.have.all.keys('p1', 'p2', 'p3');
            expect(service1Env).to.deep.equal({
                p1: 'v1',
                p2: 'v2',
                p3: 'v3',
            })

            const fsTest1Env = getMetadata(CLASS_ENVIRONMENTKEY, FSTest1)
            expect(fsTest1Env).to.have.all.keys('p1', 'p2', 'p3', 'p4');
            expect(fsTest1Env).to.deep.equal({
                p1: 'v1',
                p2: 'v2',
                p3: 'v3',
                p4: 'v4',
            })
        })
    })
})