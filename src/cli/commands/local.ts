import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'

export default ({ createContext, annotations: { getMetadata, constants, getFunctionName, rest }, projectConfig, requireValue, executor }) => {

    const pathPattern = /\{([^+\}]+)(\+?)\}/
    const pathTransform = (path, middlewares, idx = 0) => {
        const match = pathPattern.exec(path)
        if (match) {
            if (match[2]) {
                path = path.replace(match[0], '*')
                middlewares.push((req, res, next) => {
                    req.params[match[1]] = req.params[idx]
                    next()
                })
                return pathTransform(path, middlewares, idx + 1)
            } else {
                path = path.replace(match[0], `:${match[1]}`)
                return pathTransform(path, middlewares, idx)
            }
        }

        return path;
    }

    const startLocal = async (context) => {
        let app = express()
        app.use(bodyParser.json({ limit: '10mb' }))

        for (let serviceDefinition of context.publishedFunctions) {
            let httpMetadata = getMetadata(rest.environmentKey, serviceDefinition.service) || []

            for (let event of httpMetadata) {
                const isLoggingEnabled = getMetadata(constants.CLASS_LOGKEY, serviceDefinition.service)
                const transformMiddlewares = []
                const path = pathTransform(event.path, transformMiddlewares)
                console.log(`${new Date().toISOString()} ${getFunctionName(serviceDefinition.service)} listening { path: '${path}', methods: '${event.methods}', cors: ${event.cors ? true : false} }`)

                if (event.cors) {
                    app.use(path, cors())
                }

                for (const method of event.methods) {
                    app[method](
                        path,
                        logMiddleware(isLoggingEnabled, serviceDefinition.service),
                        environmentConfigMiddleware(serviceDefinition.service),
                        ...transformMiddlewares,
                        serviceDefinition.invoker
                    )
                }
            }
        }

        return app.listen(context.localPort, function () {
            process.env.FUNCTIONAL_LOCAL_PORT = context.localPort
            console.log(`App listening on port ${process.env.FUNCTIONAL_LOCAL_PORT}!`)
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

    const startServer = async (context) => {
        try {
            await context.init()
            return await executor(context, { name: 'startLocal', method: startLocal })
        } catch (e) {
            console.log(`error`, e)
        }
    }

    return {
        commands({ commander }) {
            commander
                .command('local [port] [path]')
                .description('run functional service local')
                .option('--stage <stage>', 'stage')
                .action(async (port, path, command) => {
                    process.env.FUNCTIONAL_ENVIRONMENT = 'local'

                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const localPort = requireValue(port || projectConfig.localPort, 'localPort')
                        const stage = command.stage || projectConfig.stage || 'dev'

                        process.env.FUNCTIONAL_STAGE = stage

                        let server = null
                        const context = await createContext(entryPoint, {
                            deployTarget: 'local',
                            localPort,
                            stage,
                            watchCallback: async (ctx) => {
                                if (server) {
                                    server.close()
                                }

                                server = await startServer(ctx)

                                console.log(`Compilation complete. Watching for file changes.`)
                                
                            }
                        })

                        await startServer(context)
                        
                        console.log(`Compilation complete.`)
                    } catch (e) {
                        console.log(`error`, e)
                    }
                });
        }
    }
}