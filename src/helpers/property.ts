export const get = (obj, path) => {
    return path.split('.').reduce(function (prev, curr) {
        return prev ? prev[curr] : undefined;
    }, obj);
}