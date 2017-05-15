import { Parameter_ParamKey } from '../constants'
import { getOwnMetadata, defineMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'

export const service = (name: any, ...params): any => {
    return (target, targetKey, parameterIndex: number) => {
        let parameterNames = getFunctionParameters(target, targetKey);

        let existingParameters: any[] = getOwnMetadata(Parameter_ParamKey, target, targetKey) || [];
        let paramName = parameterNames[parameterIndex];

        existingParameters.push({
            serviceTypeName: name || paramName,
            parameterIndex,
            type: 'service',
            params
        });

        defineMetadata(Parameter_ParamKey, existingParameters, target, targetKey);
    }
}
