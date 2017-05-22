import { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY, CLASS_INJECTABLEKEY, CLASS_DYNAMOTABLECONFIGURATIONKEY } from '../constants'
import { getOwnMetadata, defineMetadata, getMetadata } from '../metadata'
import { getFunctionParameters } from '../utils'
import { getFunctionName } from '../classes/functionName'

export const inject = (type: any, ...params): any => {
    return (target, targetKey, parameterIndex: number) => {
        if (!getMetadata(CLASS_INJECTABLEKEY, type)) {
            throw new Error(`type '${getFunctionName(type)}' not marked as injectable`)
        }

        const existingParameters: any[] = getOwnMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];

        existingParameters.push({
            serviceType: type,
            parameterIndex,
            type: 'inject',
            params
        });

        defineMetadata(PARAMETER_PARAMKEY, [...existingParameters], target, targetKey);

        const injectTarget = type
        const injectMetadata = getMetadata(CLASS_ENVIRONMENTKEY, injectTarget) || {}
        const metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}
        if (injectMetadata) {
            Object.keys(injectMetadata).forEach((key) => {
                metadata[key] = injectMetadata[key]
            })
            defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
        }

        const injectTableConfig = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, injectTarget) || []
        const tableConfig = getMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, target) || []
        defineMetadata(CLASS_DYNAMOTABLECONFIGURATIONKEY, [ ...tableConfig, ...injectTableConfig ], target);
    }
}
