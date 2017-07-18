import { config } from '../config'

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { ensureDirSync, copySync, removeSync } from 'fs-extra'
import { join, normalize, dirname } from 'path'

export const writeFile = (fileName, binary, basePath?) => {
    if (!basePath) {
        basePath = config.tempDirectory
        const mode = process.env.FUNCTIONAL_ENVIRONMENT
        if (mode) {
            basePath = join(basePath, mode)
        }
    }

    if (basePath) {
        const filePath = join(basePath, fileName)
        const dirPath = dirname(filePath)
        ensureDirSync(dirPath)
        writeFileSync(filePath, binary)
    }
}

export const copyFile = (from, to, basePath?) => {
    if (!basePath) {
        basePath = config.tempDirectory
        const mode = process.env.FUNCTIONAL_ENVIRONMENT
        if (mode) {
            basePath = join(basePath, mode)
        }
    }

    if (basePath) {
        const destinationFilePath = join(basePath, to)
        const dirPath = dirname(destinationFilePath)
        ensureDirSync(dirPath)
        copySync(from, destinationFilePath)
    }
}

export const removePath = (path, basePath?) => {
    if (!basePath) {
        basePath = config.tempDirectory
        const mode = process.env.FUNCTIONAL_ENVIRONMENT
        if (mode) {
            basePath = join(basePath, mode)
        }
    }

    if (basePath) {
        const targetFilePath = join(basePath, path)
        removeSync(targetFilePath)
    }
}
