import { config } from '../config'

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { ensureDirSync, copySync, removeSync } from 'fs-extra'
import { join, normalize, dirname } from 'path'

export const writeFile = (fileName, binary) => {
    if (config.tempDirectory) {
        const filePath = join(config.tempDirectory, fileName)
        const dirPath = dirname(filePath)
        ensureDirSync(dirPath)
        writeFileSync(filePath, binary)
    }
}

export const copyFile = (from, to) => {
    if (config.tempDirectory) {
        const destinationFilePath = join(config.tempDirectory, to)
        const dirPath = dirname(destinationFilePath)
        ensureDirSync(dirPath)
        copySync(from, destinationFilePath)
    }
}

export const removePath = (path) => {
    if (config.tempDirectory) {
        const targetFilePath = join(config.tempDirectory, path)
        removeSync(targetFilePath)
    }
}
