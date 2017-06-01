

export const callExtension = async (target: any, method: string, ...params) => {
    if (typeof target[method] === 'function') {
        return await target[method](...params)
    }
}