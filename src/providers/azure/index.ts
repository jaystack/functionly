import { Provider } from '../core/provider'
import { getFunctionName, constants, getMetadata } from '../../annotations'
const { CLASS_HTTPTRIGGER } = constants
import { HttpTrigger } from './eventSources/httpTrigger'
import * as request from 'request'

const eventSourceHandlers = [
    new HttpTrigger()
]

export const FUNCTIONLY_FUNCTION_KEY = 'FUNCTIONLY_FUNCTION_KEY'


export class AzureProvider extends Provider {
    public getInvoker(serviceType, serviceInstance, params): Function {
        const parameters = this.getParameters(serviceType, 'handle')

        const invoker = async (context, req) => {
            try {
                const eventContext = { context, req }

                const eventSourceHandler = eventSourceHandlers.find(h => h.available(eventContext))

                const params = []
                for (const parameter of parameters) {
                    params[parameter.parameterIndex] = await this.parameterResolver(parameter, { eventSourceHandler, eventContext })
                }

                let result
                let error
                try {
                    result = await serviceInstance.handle(...params)
                } catch (err) {
                    error = err
                }
                const response = await eventSourceHandler.resultTransform(error, result, eventContext)

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

    protected async parameterResolver(parameter, event) {
        switch (parameter.type) {
            case 'param':
                return event.eventSourceHandler.parameterResolver(parameter, event.eventContext)
            default:
                return await super.parameterResolver(parameter, event.eventContext)
        }
    }

    public async invoke(serviceInstance, params, invokeConfig?) {
        return new Promise((resolve, reject) => {

            const httpAttr = (getMetadata(CLASS_HTTPTRIGGER, serviceInstance) || [])[0]
            if (!httpAttr) {
                return reject(new Error('missing http configuration'))
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
                    return reject(new Error(`process.env.FUNCTIONLY_FUNCTION_KEY is not set, create host key to all functions`))
                }
                invokeParams.qs = { ...(invokeParams.qs || {}), code: process.env.FUNCTIONLY_FUNCTION_KEY }
            }

            try {

                request(invokeParams, (error, response, body) => {

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

export const provider = new AzureProvider()
