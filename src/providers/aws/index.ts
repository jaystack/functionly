import { Lambda } from 'aws-sdk'
import { Provider } from '../core/provider'
import { getFunctionName } from '../../annotations'
import { ApiGateway } from './eventSources/apiGateway'
import { LambdaCall } from './eventSources/lambdaCall'
import { SNS } from './eventSources/sns'
import { S3 } from './eventSources/s3'
import { DynamoTable } from './eventSources/dynamoTable'
import { parse } from 'url'
import { container } from '../../helpers/ioc'

let lambda = null;
const initAWSSDK = () => {
    if (!lambda) {
        lambda = new Lambda();
    }
    return lambda
}


const eventSourceHandlers = [
    container.resolve(ApiGateway),
    container.resolve(SNS),
    container.resolve(S3),
    container.resolve(DynamoTable),
    container.resolve(LambdaCall)
]


export class AWSProvider extends Provider {
    public getInvoker(serviceType, params, initContext): Function {
        const callContext = this.createCallContext(serviceType, 'handle', initContext)

        const invoker = async (event, context, cb) => {
            try {
                const eventContext = { event, context, cb }

                const eventSourceHandler = eventSourceHandlers.find(h => h.available(eventContext))

                let result
                let error
                try {
                    result = await callContext({ eventSourceHandler, event: eventContext, serviceType })
                } catch (err) {
                    error = err
                }
                const response = await eventSourceHandler.resultTransform(error, result, eventContext, serviceType)

                cb(null, response)
                return response
            } catch (e) {
                cb(e)
            }
        }
        return invoker
    }

    public async invoke(serviceType, params, invokeConfig?) {
        initAWSSDK()

        const funcName = getFunctionName(serviceType)
        const resolvedFuncName = process.env[`FUNCTIONAL_SERVICE_${funcName.toUpperCase()}`] || funcName

        const invokeParams = {
            FunctionName: resolvedFuncName,
            Payload: JSON.stringify(params)
        };

        return await this.invokeExec(invokeParams)
    }

    public async invokeExec(config: any): Promise<any> {
        return new Promise((resolve, reject) => {
            lambda.invoke(config, function (err, data) {
                if (err) reject(err)
                else resolve(JSON.parse(data.Payload.toString()));
            });
        })
    }
}

AWSProvider.addParameterDecoratorImplementation("param", async (parameter, context, provider) => {
    return await context.eventSourceHandler.parameterResolver(parameter, context)
})
AWSProvider.addParameterDecoratorImplementation("request", async (parameter, context, provider) => {
    if (context.eventSourceHandler.constructor.name === 'ApiGateway') {
        let body = context.event.event.body
        try {
            body = JSON.parse(body)
        } catch (e) { }

        return {
            url: parse(context.event.event.path),
            method: context.event.event.httpMethod,
            body,
            query: context.event.event.queryStringParameters,
            params: context.event.event.pathParameters,
            headers: context.event.event.headers
        }
    }
})

export const provider = container.resolve(AWSProvider)
