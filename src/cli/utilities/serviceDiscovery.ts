import { lstat, readdirSync } from 'fs'
import { FunctionalService } from '../../classes/functionalService'
import { environment } from '../../annotations'

import { join, basename, extname } from 'path'
import { set } from 'lodash'



export const serviceDiscovery = async (context) => {
    context.files = context.files || []
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
    const module = require(file)

    const name = basename(file)
    const ext = extname(name)
    const nameKey = name.substring(0, name.length - ext.length)

    Object.keys(module).forEach((key) => {
        let exportItem = module[key]

        if (exportItem.serviceType && exportItem.serviceType.createInvoker) {
            const item = {
                service: exportItem.serviceType,
                exportName: key,
                invoker: exportItem,
                handler: `${nameKey}.${key}`,
            }

            const setEnvAttrib = environment('FUNCTIONAL_ENVIRONMENT', context.deployTarget)
            setEnvAttrib(item.service)


            if (context.files.indexOf(file) < 0) {
                context.files.push(file)
            }

            context.publishedFunctions.push(item)
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