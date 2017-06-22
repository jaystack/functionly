import { Lambda } from 'aws-sdk'
import { Provider } from '../core/provider'
import { getFunctionName } from '../../annotations'
import { ApiGateway } from './eventSources/apiGateway'
import { LambdaCall } from './eventSources/lambdaCall'
import { SNS } from './eventSources/sns'
import { S3 } from './eventSources/s3'

const lambda = new Lambda();

const eventSourceHandlers = [
    new ApiGateway(),
    new SNS(),
    new S3(),
    new LambdaCall()
]


export class AWSProvider extends Provider {
    public getInvoker(serviceType, serviceInstance, params): Function {
        const parameters = this.getParameters(serviceType, 'handle')

        const invoker = async (event, context, cb) => {
            try {
                const eventContext = { event, context, cb }

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

                cb(null, response)
                return response
            } catch (e) {
                cb(e)
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

            lambda.invoke(invokeParams, function (err, data) {
                if (err) reject(err)
                else resolve(JSON.parse(data.Payload.toString()));
            });
        })
    }
}

export const provider = new AWSProvider()
