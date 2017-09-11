import { Provider } from '../core/provider'
import { getFunctionName, constants, getMetadata } from '../../annotations'
const { CLASS_HTTPTRIGGER } = constants
import { HttpTrigger } from './eventSources/httpTrigger'
import { container } from '../../helpers/ioc'
import * as request from 'request'
import { parse } from 'url'

const eventSourceHandlers = [
    container.resolve(HttpTrigger)
]

export const FUNCTIONLY_FUNCTION_KEY = 'FUNCTIONLY_FUNCTION_KEY'


export class AzureProvider extends Provider {
    public getInvoker(serviceInstance, params): Function {
        const callContext = this.createCallContext(serviceInstance, 'handle')

        const invoker = async (context, req) => {
            try {
                const eventContext = { context, req }

                const eventSourceHandler = eventSourceHandlers.find(h => h.available(eventContext))

                let result
                let error
                try {
                    result = await callContext({ eventSourceHandler, event: eventContext, serviceInstance })
                } catch (err) {
                    error = err
                }
                const response = await eventSourceHandler.resultTransform(error, result, eventContext, serviceInstance)

                context.res = response
                return response
            } catch (e) {
                context.res = {
                    status: 500,
                    body: `${e.message} - ${e.stack}`
                }
            }
        }
        return invoker
    }

    public async invoke(serviceInstance, params, invokeConfig?) {

        const httpAttr = (getMetadata(CLASS_HTTPTRIGGER, serviceInstance) || [])[0]
        if (!httpAttr) {
            throw new Error('missing http configuration')
        }

        const method = httpAttr.methods[0] || 'GET'
        const invokeParams: any = {
            method,
            url: `${process.env.FUNCION_APP_BASEURL}${httpAttr.route}`,
        };

        if (method.toLowerCase() === 'get') {
            invokeParams.qs = params
        } else {
            invokeParams.body = params
            invokeParams.json = true
        }

        if (httpAttr.authLevel !== 'anonymous') {
            if (!process.env.FUNCTIONLY_FUNCTION_KEY) {
                throw new Error(`process.env.FUNCTIONLY_FUNCTION_KEY is not set, create host key to all functions`)
            }
            invokeParams.qs = { ...(invokeParams.qs || {}), code: process.env.FUNCTIONLY_FUNCTION_KEY }
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

AzureProvider.addParameterDecoratorImplementation("param", async (parameter, context, provider) => {
    return await context.eventSourceHandler.parameterResolver(parameter, context)
})


AzureProvider.addParameterDecoratorImplementation("request", async (parameter, context, provider) => {
    if (context.eventSourceHandler.constructor.name === 'HttpTrigger') {
        return {
            url: parse(context.event.req.originalUrl),
            method: context.event.req.method,
            body: context.event.req.body,
            query: context.event.req.query,
            params: context.event.req.params,
            headers: context.event.req.headers
        }
    }
})

export const provider = container.resolve(AzureProvider)
