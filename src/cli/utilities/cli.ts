import { join, normalize } from 'path'

export let resolvePath = (path) => {
    if (/^\./.test(path)) {
        return normalize(join(process.cwd(), path))
    }

    return path;
}

export const requireValue = (value, msg) => {
    if(typeof value !== 'undefined') return value

    throw new Error(`missing value '${msg}'`)
}
