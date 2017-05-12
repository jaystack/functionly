import * as nodeZip from 'node-zip'
import { basename, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

export const zip = (context) => {
    let compressor = new nodeZip()

    for (var file of context.files) {
        compressor.file(basename(file), readFileSync(file, 'utf8'))
    }

    let zipData = compressor.generate({ base64: false, compression: 'DEFLATE' });
    context.zipData = () => zipData
}