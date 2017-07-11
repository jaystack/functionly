import { basename, join } from 'path'
import { readFileSync } from 'fs'
import { getFunctionName, getMetadata, constants } from '../../../../annotations'
const { CLASS_HTTPTRIGGER, CLASS_ENVIRONMENTKEY } = constants
import { ExecuteStep, executor } from '../../../context'
import { writeFile, copyFile, removePath } from '../../../utilities/local/file'

export const azureFunctions = ExecuteStep.register('AzureFunctions', async (context) => {
    const site = context.ARMTemplate.resources.find(r => r.type === "Microsoft.Web/sites")
    if (site) {
        const config = site.resources.find(r => r.type === "config") || { properties: {} }
        const appsettings = site.properties.siteConfig.appSettings

        for (const serviceDefinition of context.publishedFunctions) {
            const funcname = getFunctionName(serviceDefinition.service)
            await executor({
                context: { ...context, serviceDefinition, site, appsettings },
                name: `Azure-ARM-Function-${funcname}`,
                method: azureFunction
            })
        }
    }
})

export const azureFunction = async (context) => {
    const { serviceDefinition, appsettings } = context

    const environmentVariables = getMetadata(CLASS_ENVIRONMENTKEY, serviceDefinition.service) || {}
    for (const key in environmentVariables) {
        appsettings.push({
            name: key,
            value: environmentVariables[key]
        })
    }

    const httpMetadata = getMetadata(CLASS_HTTPTRIGGER, serviceDefinition.service) || []
    for (let metadata of httpMetadata) {
        await executor({
            context: { ...context, metadata },
            name: `Azure-ARM-Function-Endpoint-${metadata.method}-${metadata.path}`,
            method: azureFunctionEndpoint
        })
    }
}
export const azureFunctionEndpoint = async (context) => {
    const { serviceDefinition, site, metadata } = context

    const funcname = getFunctionName(serviceDefinition.service)


    const resourceDefinition = {
        "apiVersion": "2015-08-01",
        "name": funcname,
        "type": "functions",
        "dependsOn": [
            "[resourceId('Microsoft.Web/Sites', variables('functionAppName'))]"
        ],
        "properties": {
            "config": {
                "bindings": []
            },
            "files": {
            }
        }
    }

    await executor({
        context: { ...context, serviceDefinition, resourceDefinition },
        name: `Azure-ARM-Function-HttpBindings-${metadata.method}-${metadata.path}-${funcname}`,
        method: functionBindings
    })

    await executor({
        context: { ...context, serviceDefinition, resourceDefinition },
        name: `Azure-ARM-Function-HttpHandler-${metadata.method}-${metadata.path}-${funcname}`,
        method: functionFiles
    })

    site.resources.push(resourceDefinition)
}

export const functionBindings = async (context) => {
    const { serviceDefinition, metadata, resourceDefinition } = context

    resourceDefinition.properties.config.bindings = [
        ...resourceDefinition.properties.config.bindings,
        {
            "authLevel": metadata.authLevel,
            "name": "req",
            "type": "httpTrigger",
            "direction": "in",
            "methods": metadata.methods,
            "route": metadata.route
        },
        {
            "name": "res",
            "type": "http",
            "direction": "out"
        }
    ]
}

export const functionFiles = async (context) => {
    const { serviceDefinition, resourceDefinition } = context

    resourceDefinition.properties.files = {
        ...resourceDefinition.properties.files,
        "index.js": `module.exports = require('../${serviceDefinition.fileName}')['${serviceDefinition.exportName}']`
    }
}

export const persistAzureGithubRepo = ExecuteStep.register('PersistAzureGithubRepo', async (context) => {
    const site = context.ARMTemplate.resources.find(r => r.type === "Microsoft.Web/sites")
    if (site) {
        removePath('azuregithubrepo')

        for (const file of context.files) {
            copyFile(file, join('azuregithubrepo', basename(file)))
        }

        const functions = site.resources.filter(f => f.type === 'functions')
        for (const functionResource of functions) {
            await executor({
                context: { ...context, site, functionResource },
                name: `PersistAzureGithubRepo-${functionResource.name}`,
                method: persistFunction
            })
        }
    }
})

export const persistFunction = (context) => {
    const { functionResource, site } = context
    const basePath = join('azuregithubrepo', functionResource.name)


    for (const file in functionResource.properties.files) {
        writeFile(join(basePath, file), new Buffer(functionResource.properties.files[file], 'utf8'))
    }

    const bindings = JSON.stringify(functionResource.properties.config, null, 4)
    writeFile(join(basePath, 'function.json'), new Buffer(bindings, 'utf8'))

    const idx = site.resources.indexOf(functionResource)
    site.resources.splice(idx, 1)
}