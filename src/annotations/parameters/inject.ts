import { Parameter_ParamKey, Class_EnvironmentKey } from '../constants'
import { getOwnMetadata, defineMetadata, getMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'
import { resolveHandler } from '../classes/injectable'
// import { environment } from '../classes/environment'

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
    }
}
