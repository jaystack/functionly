import { join } from 'path'
import { readFileSync } from 'fs'
import { logger } from '../../utilities/logger'

export const projectConfig = './functionly'

export const readConfig = () => {
    const cwd = process.cwd()
    const configPath = join(cwd, projectConfig)

    try {
        return require(configPath)
    } catch (e) {
        return {}
    }

}