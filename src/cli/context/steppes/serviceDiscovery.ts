import { lstat, readdirSync } from 'fs'
import { FunctionalService } from '../../../classes/functionalService'
import { ExecuteStep } from '../core/executeStep'
import * as decache from 'decache'

import { join, basename, extname } from 'path'

export class ServiceDiscoveryStep extends ExecuteStep {
    public async method(context) {

        context.publishedFunctions = context.publishedFunctions || []

        for (let file of context.files) {
            this.collectFromFile(file, context)
        }

        return context
    }

    private collectFromFile(file, context) {
        if (context.clearRequireCache) {
            decache(file);
        }

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
                    fileName: nameKey,
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
}

export const serviceDiscovery = new ServiceDiscoveryStep('ServiceDiscovery')
