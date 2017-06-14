import { PARAMETER_PARAMKEY } from '../constants'
import { getOwnMetadata, defineMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'

export const param = (target: any, targetKey?: string, parameterIndex?: number): any => {
    let name;
    let decorator = function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);

        let existingParameters: any[] = getOwnMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];
        let paramName = parameterNames[parameterIndex];

        existingParameters.push({
            from: name || paramName,
            parameterIndex,
            type: 'param'
        });

        defineMetadata(PARAMETER_PARAMKEY, existingParameters, target, targetKey);
    }

    if (typeof target == "string" || typeof target == "undefined" || !target) {
        name = target;
        return decorator;
    } else {
        return decorator(target, targetKey, parameterIndex);
    }
}

export const event = (target, targetKey, parameterIndex: number) => {
    let parameterNames = getFunctionParameters(target, targetKey);

    let existingParameters: any[] = getOwnMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];
    let paramName = parameterNames[parameterIndex];
    existingParameters.push({
        from: paramName,
        parameterIndex,
        type: 'event'
    });
    defineMetadata(PARAMETER_PARAMKEY, existingParameters, target, targetKey);
}
