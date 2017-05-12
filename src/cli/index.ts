import { normalize, join } from 'path'
import './utilities/config'

import { init as initDeployCommand } from './commands/deploy'
import { init as initLocalCommand } from './commands/local'
import { init as initMetadataCommand } from './commands/metadata'

export const init = (commander) => {
    initDeployCommand(commander)
    initLocalCommand(commander)
    initMetadataCommand(commander)
}