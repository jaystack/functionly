import * as nodeZip from 'node-zip'
import { basename, join } from 'path'
import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { ContextStep } from '../context'

export const zip = ContextStep.register('zip', (context) => {
    let compressor = new nodeZip()

    for (const file of context.files) {
        compressor.file(basename(file), readFileSync(file, 'utf8'))
    }

    let zipData = compressor.generate({ base64: false, compression: 'DEFLATE' });

    const hash = createHash('sha256');
    hash.setEncoding('base64');
    hash.write(zipData);
    hash.end();

    context.zipData = () => zipData
    context.zipCodeSha256 = hash.read()
})