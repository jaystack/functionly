let map = new Map()

export const injectable = (target: Function) => {
    registerService(target.name, target)
}

export const registerService = (serviceName, serviceType) => {
    map.set(serviceName, serviceType)
}

export const resolveHandler = (handlerName) => {
    let handler = null
    if (typeof handlerName === 'function') {
        handler = map.get(handlerName.name)
    }
    if (typeof handlerName === 'string') {
        handler = map.get(handlerName)
    }

    if (!handler) throw new Error(`handler not exists '${handlerName}'`)
    return handler
}