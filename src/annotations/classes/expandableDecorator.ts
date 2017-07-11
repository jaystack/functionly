import { getMetadata, defineMetadata } from '../metadata'
import { CLASS_KEY_PREFIX } from '../constants'

export const expandableDecorator = function <T>(decoratorConfig: {
    name: string,
    defaultValues?: Partial<T>
    environmentKey?: string
}) {
    const environmentKey = decoratorConfig.environmentKey || `${CLASS_KEY_PREFIX}${decoratorConfig.name}`
    const environmentExtensions = new Map<string, ((target, config) => void)[]>()

    const decorator = Object.assign(
        (config: T) => {
            const _dv: any = decoratorConfig.defaultValues || {};
            const _c: any = config
            const handlerConfig = { ..._dv, ..._c }

            return (target: Function) => {
                if (environmentKey) {
                    let metadata = getMetadata(environmentKey, target) || []
                    metadata.push(handlerConfig)
                    defineMetadata(environmentKey, [...metadata], target);
                }

                const environment = process.env.FUNCTIONAL_ENVIRONMENT
                console.log(`expandableDecorator '${decoratorConfig.name}' environment: ${environment}`)
                if (!environment || !environmentExtensions.has(environment)) {
                    return;
                }

                const handlers = environmentExtensions.get(environment)
                for (const handler of handlers) {
                    handler(target, handlerConfig)
                }
            }
        },
        {
            extension: (environmentMode: string, handler: (target: Function, config: T) => any) => {
                const handlers = environmentExtensions.get(environmentMode) || []
                environmentExtensions.set(environmentMode, [...handlers, handler])
            },
            environmentKey
        }
    );

    return decorator

}