import * as request from 'request'
import { Provider } from './core/provider'
import { constants, getMetadata, getFunctionName, rest } from '../annotations'
const { CLASS_LOGKEY } = constants
import { get } from '../helpers/property'
import { container } from '../helpers/ioc'
import { parse } from 'url'

export class LocalProvider extends Provider {
    public getInvoker(serviceInstance, params) {
        const callContext = this.createCallContext(serviceInstance, 'handle')

        const invoker = async (req, res, next) => {
            try {
                const eventContext = { req, res, next }

                let result
                let error
                try {
                    result = await callContext({ event: eventContext, serviceInstance })
                } catch (err) {
                    error = err
                }
                const response = await this.resultTransform(error, result, eventContext, serviceInstance)

                res.send(response)
                return response
            } catch (e) {
                next(e)
            }
        }
        return invoker
    }

    protected resultTransform(error, result, eventContext, serviceInstance) {
        if (error) throw error

        if (result && typeof result.status === 'number' && result.hasOwnProperty('data')) {
            const { res } = eventContext

            res.status(result.status)

            if (typeof result.headers === 'object' && result.headers) {
                res.set(result.headers)
            }

            return result.data
        }

        return result
    }

    public async invoke(serviceInstance, params, invokeConfig?) {

        const httpAttr = (getMetadata(rest.environmentKey, serviceInstance) || [])[0]
        if (!httpAttr) {
            throw new Error('missing http configuration')
        }

        const method = httpAttr.methods[0] || 'GET'
        const invokeParams: any = {
            method,
            url: `http://localhost:${process.env.FUNCTIONAL_LOCAL_PORT}${httpAttr.path}`,
        };

        if (method.toLowerCase() === 'get') {
            invokeParams.qs = params
        } else {
            invokeParams.body = params
            invokeParams.json = true
        }


        const isLoggingEnabled = getMetadata(CLASS_LOGKEY, serviceInstance)
        if (isLoggingEnabled) {
            console.log(`${new Date().toISOString()} request to ${getFunctionName(serviceInstance)}`, JSON.stringify(invokeParams, null, 2))
        }

        return await this.invokeExec(invokeParams)
    }

    public async invokeExec(config: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                request(config, (error, response, body) => {

                    if (error) return reject(error)

                    let result = body
                    try {
                        result = JSON.parse(result)
                    }
                    catch (e) { }

                    return resolve(result)

                })
            } catch (e) {
                return reject(e);
            }
        })
    }
}

LocalProvider.addParameterDecoratorImplementation("param", async (parameter, context, provider) => {
    const req = context.event.req
    const source = parameter.source;
    if (typeof source !== 'undefined') {
        const holder = !source ? context : get(context, source)
        if (holder) {
            return get(holder, parameter.from)
        }
    } else {
        let value = undefined
        if (typeof (value = get(req.body, parameter.from)) !== 'undefined') return value
        if (typeof (value = get(req.query, parameter.from)) !== 'undefined') return value
        if (typeof (value = get(req.params, parameter.from)) !== 'undefined') return value
        if (typeof (value = get(req.headers, parameter.from)) !== 'undefined') return value
        return value
    }
    return undefined
})

LocalProvider.addParameterDecoratorImplementation("request", async (parameter, context, provider) => {
    return {
        url: context.event.req._parsedUrl || parse(context.event.req.originalUrl),
        method: context.event.req.method,
        body: context.event.req.body,
        query: context.event.req.query,
        params: context.event.req.params,
        headers: context.event.req.headers
    }
})

export const provider = container.resolve(LocalProvider)
