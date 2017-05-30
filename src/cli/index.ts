import { normalize, join } from 'path'
import './utilities/config'

import { init as initDeployCommand } from './commands/deploy'
import { init as initLocalCommand } from './commands/local'
import { init as initMetadataCommand } from './commands/metadata'
import { init as initPlugins } from './plugins'

export const init = (commander) => {
    initDeployCommand(commander)
    initLocalCommand(commander)
    initMetadataCommand(commander)

    initPlugins(commander)
}