import * as request from 'request'
import { Provider } from './core/provider'
import { constants, getOwnMetadata, getMetadata, getFunctionName } from '../annotations'
import { get } from '../helpers/property'

export class LocalProvider extends Provider {
    public getInvoker(serviceType, serviceInstance, params) {
        const parameters = this.getParameters(serviceType, 'handle')

        const invoker = async (req, res, next) => {
            try {
                const params = []
                for (const parameter of parameters) {
                    params[parameter.parameterIndex] = await this.parameterResolver(parameter, { req, res, next })
                }

                const r = await serviceInstance.handle(...params)
                res.send(r)
                return r
            } catch (e) {
                next(e)
            }
        }
        return invoker
    }

    protected async parameterResolver(parameter, event) {
        const req = event.req
        const source = parameter.source;
        switch (parameter.type) {
            case 'param':
                if (typeof source !== 'undefined') {
                    const holder = !source ? req : get(req, source)
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
            default:
                return await super.parameterResolver(parameter, event)
        }
    }

    public async invoke(serviceInstance, params, invokeConfig?) {
        return new Promise((resolve, reject) => {

            const httpAttr = getMetadata(constants.CLASS_APIGATEWAYKEY, serviceInstance)[0]
            if (!httpAttr) {
                return reject(new Error('missing http configuration'))
            }

            const invokeParams: any = {
                method: httpAttr.method || 'GET',
                url: `http://localhost:${process.env.FUNCTIONAL_LOCAL_PORT}${httpAttr.path}`,
            };

            if (!httpAttr.method || httpAttr.method.toLowerCase() === 'get') {
                invokeParams.qs = params
            } else {
                invokeParams.body = params
                invokeParams.json = true
            }

            try {

                const isLoggingEnabled = getMetadata(constants.CLASS_LOGKEY, serviceInstance)
                if (isLoggingEnabled) {
                    console.log(`${new Date().toISOString()} request to ${getFunctionName(serviceInstance)}`, JSON.stringify(invokeParams, null, 2))
                }

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

export const provider = new LocalProvider()
