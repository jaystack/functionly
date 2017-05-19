import { Parameter_ParamKey, Class_EnvironmentKey, Class_InjectableKey, Class_DynamoTableConfigurationKey } from '../constants'
import { getOwnMetadata, defineMetadata, getMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'
import { getFunctionName } from '../classes/functionName'

export const inject = (type: any, ...params): any => {
    return (target, targetKey, parameterIndex: number) => {
        if (!getMetadata(Class_InjectableKey, type)) {
            throw new Error(`type '${getFunctionName(type)}' not marked as injectable`)
        }

        const existingParameters: any[] = getOwnMetadata(Parameter_ParamKey, target, targetKey) || [];

        existingParameters.push({
            serviceType: type,
            parameterIndex,
            type: 'inject',
            params
        });

        defineMetadata(Parameter_ParamKey, [...existingParameters], target, targetKey);

        const injectTarget = type
        const injectMetadata = getMetadata(Class_EnvironmentKey, injectTarget) || {}
        const metadata = getMetadata(Class_EnvironmentKey, target) || {}
        if (injectMetadata) {
            Object.keys(injectMetadata).forEach((key) => {
                metadata[key] = injectMetadata[key]
            })
            defineMetadata(Class_EnvironmentKey, { ...metadata }, target);
        }

        const injectTableConfig = getMetadata(Class_DynamoTableConfigurationKey, injectTarget) || []
        const tableConfig = getMetadata(Class_DynamoTableConfigurationKey, target) || []
        defineMetadata(Class_DynamoTableConfigurationKey, [ ...tableConfig, ...injectTableConfig ], target);
    }
}
