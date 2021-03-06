import { normalize, join } from 'path'
import './utilities/config'
import './providers'

//built-in commands
import * as deploy from './commands/deploy'
import * as deployPackage from './commands/package'
import * as start from './commands/start'
import * as metadata from './commands/metadata'
import * as serverless from './commands/serverless'

import { init as initProjectConfig, internalPluginLoad } from './project/init'

export const init = (commander) => {
    internalPluginLoad(deploy)
    internalPluginLoad(deployPackage)
    internalPluginLoad(start)
    internalPluginLoad(metadata)
    internalPluginLoad(serverless)

    initProjectConfig(commander)
}