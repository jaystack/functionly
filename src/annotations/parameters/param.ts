import { Parameter_ParamKey } from '../constants'
import { getOwnMetadata, defineMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'

export const param = (target: any, targetKey?: string, parameterIndex?: number): any => {
    let name;
    let decorator = function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);

        let existingParameters: any[] = getOwnMetadata(Parameter_ParamKey, target, targetKey) || [];
        let paramName = parameterNames[parameterIndex];

        existingParameters.push({
            from: name || paramName,
            parameterIndex,
            type: 'param'
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