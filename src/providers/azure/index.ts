import { Provider } from '../core/provider'
import { getFunctionName } from '../../annotations'
import { HttpTrigger } from './eventSources/httpTrigger'

const eventSourceHandlers = [
    new HttpTrigger()
]

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

            const funcName = getFunctionName(serviceInstance)
            const resolvedFuncName = process.env[`FUNCTIONAL_SERVICE_${funcName.toUpperCase()}`] || funcName

            const invokeParams = {
                FunctionName: resolvedFuncName,
                Payload: JSON.stringify(params)
            };

            // TODO invoke
        })
    }
}

export const provider = new AzureProvider()
