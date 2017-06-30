import 'mocha'
import { expect } from 'chai'

import {
    CLASS_APIGATEWAYKEY, CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_ENVIRONMENTKEY, CLASS_NAMEKEY,
    CLASS_INJECTABLEKEY, CLASS_LOGKEY, CLASS_RUNTIMEKEY, CLASS_MEMORYSIZEKEY, CLASS_TIMEOUTKEY,
    CLASS_S3CONFIGURATIONKEY, CLASS_SNSCONFIGURATIONKEY, CLASS_TAGKEY, CLASS_ROLEKEY, CLASS_DESCRIPTIONKEY,
    PARAMETER_PARAMKEY
} from '../src/annotations/constants'
import { applyTemplates, templates } from '../src/annotations/templates'
import { getFunctionParameters } from '../src/annotations/utils'
import { getMetadata, getOwnMetadata } from '../src/annotations/metadata'
import { apiGateway } from '../src/annotations/classes/apiGateway'
import { dynamoTable, __dynamoDBDefaults } from '../src/annotations/classes/dynamoTable'
import { environment } from '../src/annotations/classes/environment'
import { functionName, getFunctionName } from '../src/annotations/classes/functionName'
import { injectable } from '../src/annotations/classes/injectable'
import { log } from '../src/annotations/classes/log'
import { runtime } from '../src/annotations/classes/runtime'
import { s3Storage } from '../src/annotations/classes/s3Storage'
import { sns } from '../src/annotations/classes/sns'
import { tag } from '../src/annotations/classes/tag'
import { role, description } from '../src/annotations'

import { inject } from '../src/annotations/parameters/inject'
import { param } from '../src/annotations/parameters/param'
import { FunctionalService, Service, DynamoDB, SimpleNotificationService, S3Storage } from '../src/classes'



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
        describe("dynamoTable", () => {
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
                @injectable
                class InjectableTestClass { }

                const value = getMetadata(CLASS_INJECTABLEKEY, InjectableTestClass)

                expect(value).to.equal(true)
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
        describe("runtime", () => {
            it("type", () => {
                @runtime({ type: 'nodejs6.10' })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_RUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_MEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_TIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.equal('nodejs6.10')
                expect(memoryValue).to.undefined
                expect(timeoutValue).to.undefined
            })
            it("memorySize", () => {
                @runtime({ memorySize: 100 })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_RUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_MEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_TIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.undefined
                expect(memoryValue).to.equal(100)
                expect(timeoutValue).to.undefined
            })
            it("timeout", () => {
                @runtime({ timeout: 3 })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_RUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_MEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_TIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.undefined
                expect(memoryValue).to.undefined
                expect(timeoutValue).to.equal(3)
            })
            it("all", () => {
                @runtime({ type: 'nodejs6.10', memorySize: 100, timeout: 3 })
                class RuntimeTestClass { }

                const runtimeValue = getMetadata(CLASS_RUNTIMEKEY, RuntimeTestClass)
                const memoryValue = getMetadata(CLASS_MEMORYSIZEKEY, RuntimeTestClass)
                const timeoutValue = getMetadata(CLASS_TIMEOUTKEY, RuntimeTestClass)

                expect(runtimeValue).to.equal('nodejs6.10')
                expect(memoryValue).to.equal(100)
                expect(timeoutValue).to.equal(3)
            })
        })
        describe("s3Storage", () => {
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
    })

    describe("parameters", () => {
        describe("inject", () => {
            it("inject", () => {
                @injectable
                class ATestClass { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')
            })

            it("functional service inject", () => {
                @injectable
                class ATestClass extends FunctionalService { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`FUNCTIONAL_SERVICE_${ATestClass.name.toUpperCase()}`, getFunctionName(ATestClass))
            })

            it("service inject", () => {
                @injectable
                @environment('%ClassName%_defined_environment', 'value')
                class ATestClass extends Service { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, BTestClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('serviceType', ATestClass)
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'inject')

                const environmentMetadata = getMetadata(CLASS_ENVIRONMENTKEY, BTestClass)
                expect(environmentMetadata).to.have
                    .property(`ATestClass_defined_environment`, 'value')
            });

            it("injected DynamoDB", () => {
                @injectable
                @dynamoTable({ tableName: 'ATable' })
                class ATestClass extends DynamoDB { }
                class BTestClass {
                    method( @inject(ATestClass) a) { }
                }

                const value = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, BTestClass)

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('tableName', 'ATable')
            })

            it("injected SimpleNotificationService", () => {
                @injectable
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
                @injectable
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
        })
        describe("param", () => {
            it("inject", () => {
                class ParamClass {
                    method( @param name) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'name')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
            })
            it("inject custom name", () => {
                class ParamClass {
                    method( @param('fullName') name) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'fullName')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
            })
            it("inject param index", () => {
                class ParamClass {
                    method( @param name, @param fullName) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

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
            it("inject with config", () => {
                class ParamClass {
                    method( @param({ name: 'fullName', p1: 1, p2: 'p2' }) name) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'fullName')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
                expect(metadata).to.have.property('p1', 1)
                expect(metadata).to.have.property('p2', 'p2')
            })
            it("inject with config without name", () => {
                class ParamClass {
                    method( @param({ p1: 1, p2: 'p2' }) shortName) { }
                }

                const value = getOwnMetadata(PARAMETER_PARAMKEY, ParamClass, 'method')

                expect(value).to.have.lengthOf(1);

                const metadata = value[0]

                expect(metadata).to.have.property('from', 'shortName')
                expect(metadata).to.have.property('parameterIndex', 0)
                expect(metadata).to.have.property('type', 'param')
                expect(metadata).to.have.property('p1', 1)
                expect(metadata).to.have.property('p2', 'p2')
            })
        })
    })
})