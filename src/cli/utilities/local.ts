import * as express from 'express'
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


export const local = async (context) => {
    let app = express()

    for (let serviceDefinition of context.publishedFunctions) {
        let httpMetadata = getMetadata(constants.Class_HttpKey, serviceDefinition.service)

        for (let event of httpMetadata) {
            app[event.method](
                event.path,
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
