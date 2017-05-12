import { Parameter_ParamKey } from '../constants'
import { getOwnMetadata, defineMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'

export const service = (target: any, targetKey?: string, parameterIndex?: number): any => {
    let name;
    let decorator = function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);

        let existingParameters: any[] = getOwnMetadata(Parameter_ParamKey, target, targetKey) || [];
        let paramName = parameterNames[parameterIndex];

        existingParameters.push({
            serviceTypeName: name || paramName,
            parameterIndex,
            type: 'service'
        });

        defineMetadata(Parameter_ParamKey, existingParameters, target, targetKey);
    }

    if (typeof target == "string" || typeof target == "undefined" || !target) {
        name = target;
        return decorator;
    } else {
        return decorator(target, targetKey, parameterIndex);
    }
}