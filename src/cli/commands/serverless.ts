import { writeFileSync } from 'fs'
import { extname } from 'path'
import { stringify } from 'yamljs'

export const FUNCTIONAL_ENVIRONMENT = 'aws'

export default (api) => {
    const {
        createContext,
        annotations: {
            getMetadata, getMetadataKeys, getFunctionName,
            constants: {
                CLASS_AWSRUNTIMEKEY,
                CLASS_ENVIRONMENTKEY,
                CLASS_APIGATEWAYKEY
            },
            __dynamoDBDefaults
        },
        projectConfig,
        requireValue, resolvePath,
        ExecuteStep, executor
    } = api

    const serverlessConfig = async (context) => {
        context.serverless = {
            service: projectConfig.name || 'unknown'
        }
    }

    const providerConfig = async (context) => {
        context.serverless.provider = {
            name: FUNCTIONAL_ENVIRONMENT,
            region: context.awsRegion,
            stage: context.stage,
            environment: {}
        }
        await executor({ context, name: 'iamRoleConfig', method: iamRoleConfig })
    }

    const iamRoleConfig = async (context) => {
        context.serverless.provider.iamRoleStatements = [
            {
                Effect: 'Allow',
                Action: [
                    'lambda:InvokeAsync',
                    'lambda:InvokeFunction'
                ],
                Resource: ['*']
            }
        ]
        if (context.tableConfigs && context.tableConfigs.length) {
            const dynamoStatement = {
                Effect: 'Allow',
                Action: [
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem'
                ],
                Resource: []
            }

            for (const tableConfig of context.tableConfigs) {
                const properties = { TableName: tableConfig.tableName, ...tableConfig.nativeConfig }
                dynamoStatement.Resource.push("arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/" + properties.TableName + '-' + context.stage)
            }

            context.serverless.provider.iamRoleStatements.push(dynamoStatement)
        }
    }

    const functionsConfig = async (context) => {
        context.serverless.functions = {}

        for (const serviceDefinition of context.publishedFunctions) {
            await executor({
                context: { ...context, serviceDefinition },
                name: 'functionExport',
                method: functionExport
            })
        }
    }

    const functionExport = async (context) => {
        const { serviceDefinition, serverless } = context

        const functionName = getFunctionName(serviceDefinition.service)
        const executePath = process.cwd()
        let handler: string = serviceDefinition.file.replace(executePath, '')
        const ext = extname(handler)
        const nameKey = handler.substring(1, handler.length - ext.length).replace(/\\/g, '/')

        const def = serverless.functions[functionName] = {
            handler: `${nameKey}.${serviceDefinition.exportName}`,
            runtime: getMetadata(CLASS_AWSRUNTIMEKEY, serviceDefinition.service) || "nodejs6.10"
        }

        await executor({ context, name: 'funtionEnvironments', method: funtionEnvironments })
        await executor({ context, name: 'funtionEvents', method: funtionEvents })
    }

    const functional_service_regexp = /^FUNCTIONAL_SERVICE_/
    const funtionEnvironments = async ({ serviceDefinition, serverless }) => {
        const functionName = getFunctionName(serviceDefinition.service)
        const environments = getMetadata(CLASS_ENVIRONMENTKEY, serviceDefinition.service)
        if (environments) {
            serverless.functions[functionName].environment = {}
            for (const key in environments) {
                let environmentValue = environments[key]
                if (functional_service_regexp.test(key)) {
                    environmentValue = `${serverless.service}-${serverless.provider.stage}-${environmentValue}`
                }
                serverless.functions[functionName].environment[key] = environmentValue
            }
        }

    }

    const funtionEvents = ({ serviceDefinition, serverless }) => {
        const functionName = getFunctionName(serviceDefinition.service)
        let httpMetadata = getMetadata(CLASS_APIGATEWAYKEY, serviceDefinition.service) || []
        for (const { method, path, cors } of httpMetadata) {
            const resourcePath = /^\//.test(path) ? path.substring(1, path.length) : path
            const defs = serverless.functions[functionName].events = serverless.functions[functionName].events || []
            const def: any = {
                http: {
                    method,
                    path: resourcePath
                }
            }

            if (cors) {
                def.http.cors = {
                    origins: '*'
                }
            }
            defs.push(def)
        }
    }

    const resourcesConfig = async (context) => {
        context.serverless.resources = {
            Resources: {}
        }

        for (const tableDefinition of context.tableConfigs) {
            await executor({
                context: { ...context, tableConfig: tableDefinition },
                name: 'tableConfig',
                method: tableConfiguration
            })
        }

    }

    const tableConfiguration = async ({ stage, tableConfig, serverless }) => {
        const properties = {
            ...__dynamoDBDefaults,
            TableName: tableConfig.tableName,
            ...tableConfig.nativeConfig
        }

        const resName = properties.TableName
        properties.TableName += '-' + stage

        const tableResource = {
            "Type": "AWS::DynamoDB::Table",
            "Properties": properties
        }

        const name = normalizeName(resName)

        serverless.resources.Resources[name] = tableResource
    }

    const saveConfig = async ({ serverless }) => {
        writeFileSync('serverless.yml', stringify(serverless, Number.MAX_SAFE_INTEGER))
    }

    const build = async (context) => {
        await executor({ context, name: 'serverlessConfig', method: serverlessConfig })
        await executor({ context, name: 'providerConfig', method: providerConfig })
        await executor({ context, name: 'functionsConfig', method: functionsConfig })
        await executor({ context, name: 'resourcesConfig', method: resourcesConfig })
        await executor({ context, name: 'saveConfig', method: saveConfig })
    }



    return {
        commands({ commander }) {
            commander
                .command('serverless [path]')
                .alias('sls')
                .option('--aws-region <awsRegion>', 'AWS_REGION')
                .option('--stage <stage>', 'stage')
                .description('serverless config')
                .action(async (path, command) => {

                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const awsRegion = requireValue(command.awsRegion || projectConfig.awsRegion, 'awsRegion')
                        const stage = command.stage || projectConfig.stage || 'dev'

                        process.env.FUNCTIONAL_ENVIRONMENT = FUNCTIONAL_ENVIRONMENT
                        process.env.FUNCTIONAL_STAGE = stage

                        const context = await createContext(entryPoint, {
                            deployTarget: FUNCTIONAL_ENVIRONMENT,
                            awsRegion,
                            FUNCTIONAL_ENVIRONMENT,
                            stage
                        })
                        await context.init()

                        await executor(context, ExecuteStep.get('SetFunctionalEnvironment'))

                        await build(context)

                        console.log(`done`)
                    } catch (e) {
                        console.log(`error`, e)
                    }
                });
        },
        deployProviders: {
            sls: {
                FUNCTIONAL_ENVIRONMENT,
                createEnvironment: build
            }
        }
    }
}

export const nameReplaceRegexp = /[^a-zA-Z0-9]/g
export const normalizeName = (name: string) => {
    const result = name.replace(nameReplaceRegexp, '')
    if (!result) {
        throw new Error(`'invalid name '${name}'`)
    }
    return result
}
