import { Parameter_ParamKey, Class_EnvironmentKey } from '../constants'
import { getOwnMetadata, defineMetadata, getMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'
import { resolveHandler } from '../classes/injectable'

export const inject = (name: any, ...params): any => {
    return (target, targetKey, parameterIndex: number) => {
        let parameterNames = getFunctionParameters(target, targetKey);

        let existingParameters: any[] = getOwnMetadata(Parameter_ParamKey, target, targetKey) || [];
        let paramName = parameterNames[parameterIndex];

        existingParameters.push({
            serviceTypeName: name || paramName,
            parameterIndex,
            type: 'inject',
            params
        });

        defineMetadata(Parameter_ParamKey, [...existingParameters], target, targetKey);

        let injectTarget = resolveHandler(name)
        let injectMetadata = getMetadata(Class_EnvironmentKey, injectTarget) || {}
        let metadata = getMetadata(Class_EnvironmentKey, target) || {}
        if (injectMetadata) {
            Object.keys(injectMetadata).forEach((key) => {
                metadata[key] = injectMetadata[key]
            })
            defineMetadata(Class_EnvironmentKey, { ...metadata }, target);
        }
    }
}
