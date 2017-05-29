export { serviceDiscovery } from './core/serviceDiscovery'
export { tableDiscovery } from './core/tableDiscovery'
export { setFunctionalEnvironment } from './core/setFunctionalEnvironment'

import { resolvePath } from '../utilities/cli'
import { defaults } from 'lodash'

import { serviceDiscovery } from './core/serviceDiscovery'
import { tableDiscovery } from './core/tableDiscovery'

export const tasks = [
    serviceDiscovery,
    tableDiscovery
]

export const createContext = async (path, defaultValues) => {
    const context = defaults({}, {
        serviceRoot: resolvePath(path),
        date: new Date()
    }, defaultValues)

    for (const t of tasks) {
        await t(context)
    }

    return context
}
