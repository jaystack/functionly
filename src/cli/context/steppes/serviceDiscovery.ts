import { lstat, readdirSync } from 'fs'
import { FunctionalService } from '../../../classes/functionalService'
import { ContextStep } from '../core/contextStep'

import { join, basename, extname } from 'path'
import { set } from 'lodash'

export class ServiceDiscoveryStep extends ContextStep {
    public async execute(context) {

        context.files = context.files || []
        context.publishedFunctions = context.publishedFunctions || []

        const path = context.serviceRoot

        let isDir = await this.isDirectory(path)

        let files = [path]
        if (isDir) {
            files = await this.getJsFiles(path)
        }

        for (let file of files) {
            this.collectFromFile(file, context)
        }

        return context
    }


    private collectFromFile(file, context) {
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
                    file
                }

                if (context.files.indexOf(file) < 0) {
                    context.files.push(file)
                }

                context.publishedFunctions.push(item)
            }

        })
    }

    private getJsFiles(folder) {
        let files = readdirSync(folder);
        let filter = /\.js$/
        return files.filter(name => filter.test(name)).map(file => join(folder, file))
    }
    private isDirectory(path) {
        return new Promise((resolve, reject) => {
            lstat(path, (err, stats) => {
                if (err) return reject(err);
                return resolve(stats.isDirectory())
            });
        })
    }

}

export const serviceDiscovery = new ServiceDiscoveryStep('serviceDiscovery')
