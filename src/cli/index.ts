import { normalize, join } from 'path'
import './utilities/config'
import './providers'

//built-in commands
import * as deploy from './commands/deploy'
import * as local from './commands/local'
import * as metadata from './commands/metadata'
import * as serverless from './commands/serverless'

import { init as initProjectConfig, internalPluginLoad } from './project/init'

export const init = (commander) => {
    internalPluginLoad(deploy)
    internalPluginLoad(local)
    internalPluginLoad(metadata)
    internalPluginLoad(serverless)

    initProjectConfig(commander)
}