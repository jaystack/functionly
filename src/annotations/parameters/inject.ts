import { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY, CLASS_INJECTABLEKEY } from '../constants'
import { defineMetadata, getOwnMetadata } from '../metadata'
import { getFunctionName } from '../classes/functionName'

export const inject = (type: any, ...params): any => {
    return (target, targetKey, parameterIndex: number) => {
        if (!getOwnMetadata(CLASS_INJECTABLEKEY, type)) {
            throw new Error(`type '${getFunctionName(type)}' not marked as injectable`)
        }

        const existingParameters: any[] = getOwnMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];

        existingParameters.push({
            serviceType: type,
            parameterIndex,
            targetKey,
            type: 'inject',
            params
        });

        defineMetadata(PARAMETER_PARAMKEY, [...existingParameters], target, targetKey);

        if (typeof type.onDefineInjectTo === 'function') {
            type.onDefineInjectTo(target, targetKey, parameterIndex)
        }
    }
}
