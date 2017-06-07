import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'

export default ({ createContext, annotations: { getMetadata, constants, getFunctionName }, projectConfig, requireValue }) => {

    const startLocal = async (context) => {
        let app = express()
        app.use(bodyParser.json())

        for (let serviceDefinition of context.publishedFunctions) {
            let httpMetadata = getMetadata(constants.CLASS_APIGATEWAYKEY, serviceDefinition.service)

            for (let event of httpMetadata) {
                const normalizedPath = /^\//.test( event.path) ? event.path : `/${event.path}`
                const isLoggingEnabled = getMetadata(constants.CLASS_LOGKEY, serviceDefinition.service)
                console.log(`${new Date().toISOString()} ${getFunctionName(serviceDefinition.service)} listening { path: '${normalizedPath}', method: '${event.method}', cors: ${event.cors ? true : false} }`)

                if (event.cors) {
                    app.use(normalizedPath, cors())
                }

                app[event.method](
                    normalizedPath,
                    logMiddleware(isLoggingEnabled, serviceDefinition.service),
                    environmentConfigMiddleware(serviceDefinition.service),
                    serviceDefinition.invoker
                )
            }
        }

        app.listen(context.localPort, function () {
            process.env.FUNCTIONAL_LOCAL_PORT = context.localPort
            console.log(`Example app listening on port ${process.env.FUNCTIONAL_LOCAL_PORT}!`)
        })
    }

    const logMiddleware = (enabled, serviceType) => {
        return (req, res, next) => {
            if (!enabled) return next()

            console.log(`${new Date().toISOString()} ${getFunctionName(serviceType)}`, JSON.stringify({
                url: req.url,
                query: req.query,
                params: req.params,
                body: req.body,
                headers: req.headers
            }, null, 2))

            next()
        }
    }

    const environmentConfigMiddleware = (serviceType) => {
        return (req, res, next) => {
            const environmentVariables = getMetadata(constants.CLASS_ENVIRONMENTKEY, serviceType) || {}

            let originals = {}
            Object.keys(environmentVariables).forEach((key) => {
                if (key in process.env) {
                    originals[key] = process.env[key]
                }

                process.env[key] = environmentVariables[key]
            })


            req.on("end", function () {
                Object.keys(environmentVariables).forEach((key) => {
                    if (key in originals) {
                        process.env[key] = originals[key]
                    } else {
                        delete process.env[key]
                    }
                })
            });

            next()
        }
    }

    return {
        commands({ commander }) {
            commander
                .command('local [port] [path]')
                .description('run functional service local')
                .action(async (port, path, command) => {
                    process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const localPort = requireValue(port || projectConfig.localPort, 'localPort')

                        const context = await createContext(entryPoint, {
                            deployTarget: 'local',
                            localPort
                        })

                        await context.runStep({ name: 'startLocal', execute: startLocal })

                        console.log(`done`)
                    } catch (e) {
                        console.log(`error`, e)
                    }
                });
        }
    }
}