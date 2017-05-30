import { join } from 'path'
import { readFileSync } from 'fs'
import { logger } from '../../utilities/logger'

export const projectConfig = './functionly.json'

export const readConfig = () => {
    const cwd = process.cwd()
    const configPath = join(cwd, projectConfig)

    try {
        const fileContent = readFileSync(configPath, 'utf8')
        return JSON.parse(fileContent)
    } catch (e) {
        return {}
    }

}