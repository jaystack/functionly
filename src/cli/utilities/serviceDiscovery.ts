import { lstat, readdirSync } from 'fs'
import { FunctionalService } from '../../classes/functionalService'
import { environment } from '../../annotations'

import { join, basename, extname } from 'path'
import { set } from 'lodash'



export const serviceDiscovery = async (context) => {
    context.files = context.files || []
    context.functions = context.functions || []
    context.publishedFunctions = context.publishedFunctions || []

    const path = context.serviceRoot

    let isDir = await isDirectory(path)

    let files = [path]
    if (isDir) {
        files = await getJsFiles(path)
    }

    for (let file of files) {
        collectFromFile(file, context)
    }

    return context
}

export const collectFromFile = (file, context) => {
    let module = require(file)

    let name = basename(file)
    const ext = extname(name)
    const nameKey = name.substring(0, name.length - ext.length)

    Object.keys(module).forEach((key) => {
        let exportItem = module[key]

        if (exportItem.createInvoker) {
            context.functions.push({ service: exportItem })

            const setEnvAttrib = environment('FUNCTIONAL_ENVIRONMENT', context.deployTarget)
            setEnvAttrib(exportItem)

            if (context.files.indexOf(file) < 0) {
                context.files.push(file)
            }

        } else if (exportItem.serviceType && exportItem.serviceType.createInvoker) {

            let item = context.functions.find((it) => it.service === exportItem.serviceType)
            if (item) {
                item.exportName = key
                item.invoker = exportItem

                item.handler = `${nameKey}.${key}`
                context.publishedFunctions.push(item)
            }

        }

    })
}

export const getJsFiles = (folder) => {
    let files = readdirSync(folder);
    let filter = /\.js$/
    return files.filter(name => filter.test(name)).map(file => join(folder, file))
}



export const isDirectory = (path) => {
    return new Promise((resolve, reject) => {
        lstat(path, (err, stats) => {
            if (err) return reject(err);
            return resolve(stats.isDirectory())
        });
    })
}