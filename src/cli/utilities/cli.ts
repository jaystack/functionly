import { join, normalize } from 'path'

export let resolvePath = (path) => {
    if (/^\./.test(path)) {
        return normalize(join(process.cwd(), path))
    }

    return path;
}