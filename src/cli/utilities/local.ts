import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import { getMetadata, constants } from '../../annotations'
import { config } from './config'

const environmentConfigMiddleware = (serviceType) => {
    return (req, res, next) => {
        const environmentVariables = getMetadata(constants.Class_EnvironmentKey, serviceType) || {}

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

const logMiddleware = (enabled, serviceType) => {
    return (req, res, next) => {
        if (!enabled) return next()

        console.log(`${new Date().toISOString()} ${serviceType.name}`, JSON.stringify({
            url: req.url,
            query: req.query,
            params: req.params,
            body: req.body,
            headers: req.headers
        }, null, 2))

        next()
    }
}


export const local = async (context) => {
    let app = express()
    app.use(bodyParser.json())

    for (let serviceDefinition of context.publishedFunctions) {
        let httpMetadata = getMetadata(constants.Class_ApiGatewayKey, serviceDefinition.service)

        for (let event of httpMetadata) {
            const isLoggingEnabled = getMetadata(constants.Class_LogKey, serviceDefinition.service)
            if (isLoggingEnabled) {
                console.log(`${new Date().toISOString()} ${serviceDefinition.service.name} listening { path: '${event.path}', method: '${event.method}', cors: ${event.cors ? true : false} }`)
            }

            if (event.cors) {
                app.use(event.path, cors())
            }

            app[event.method](
                event.path,
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
