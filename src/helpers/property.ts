export const get = (obj, path) => {
    if (typeof path === 'function') {
        return path(obj)
    }
    if (typeof path === 'string') {
        return path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : undefined;
        }, obj)
    }
}