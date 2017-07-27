import { PARAMETER_PARAMKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'

export const param = (target: any, targetKey?: string, parameterIndex?: number): any => {
    let name;
    let config = {};
    let decorator = function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);

        let existingParameters: any[] = getMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];
        let paramName = parameterNames[parameterIndex];

        existingParameters.push({
            ...config,
            from: name || paramName,
            parameterIndex,
            type: 'param'
        });

        defineMetadata(PARAMETER_PARAMKEY, existingParameters, target, targetKey);
    }

    if (typeof target == "string" || typeof target == "undefined" || !target) {
        name = target;
        return decorator;
    } else if (typeof target === 'object' && target && !targetKey) {
        name = target.name;
        config = target
        return decorator
    } else {
        return decorator(target, targetKey, parameterIndex);
    }
}

export const createParameterDecorator = (type: string, defaultConfig?: any) => (target?, targetKey?, parameterIndex?: number): any => {
    let config = { ...(defaultConfig || {}) };

    const decorator = function (target, targetKey, parameterIndex: number) {
        const parameterNames = getFunctionParameters(target, targetKey);

        const existingParameters: any[] = getMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];
        const paramName = parameterNames[parameterIndex];
        existingParameters.push({
            from: paramName,
            parameterIndex,
            targetKey,
            type,
            config
        });
        defineMetadata(PARAMETER_PARAMKEY, existingParameters, target, targetKey);
    }

    if (typeof target == "undefined" || !target) {
        return decorator
    } else if (typeof target === 'object' && target && !targetKey) {
        config = { ...config, ...target }
        return decorator
    } else {
        return decorator(target, targetKey, parameterIndex);
    }
}

export const serviceParams = createParameterDecorator('serviceParams')
export const request = createParameterDecorator('request')
export const context = createParameterDecorator('context')
export const error = createParameterDecorator('error')
