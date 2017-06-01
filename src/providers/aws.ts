import { Lambda } from 'aws-sdk'
import { Provider } from './core/provider'
import { getFunctionName } from '../annotations'

const lambda = new Lambda();

export class AWSProvider extends Provider {
    public getInvoker(serviceType, serviceInstance, params): Function {
        const parameters = this.getParameters(serviceType, 'handle')

        const invoker = async (event, context, cb) => {
            try {
                const params = []
                for (const parameter of parameters) {
                    params[parameter.parameterIndex] = await this.awsParameterResolver(event, context, parameter)
                }

                const r = await serviceInstance.handle(...params)
                cb(null, r)
                return r
            } catch (e) {
                cb(e)
            }
        }
        return invoker
    }

    protected async awsParameterResolver(event, context, parameter) {
        switch (parameter.type) {
            case 'param':
                return event[parameter.from]
            default:
                return await super.parameterResolver(parameter)
        }
    }

    public async invoke(serviceInstance, params, invokeConfig?) {
        return new Promise((resolve, reject) => {

            const invokeParams = {
                FunctionName: getFunctionName(serviceInstance),
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
