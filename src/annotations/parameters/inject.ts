import { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY, CLASS_INJECTABLEKEY, CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_SNSCONFIGURATIONKEY } from '../constants'
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
        const metadata = getMetadata(CLASS_ENVIRONMENTKEY, target) || {}
        if (injectTarget.createInvoker) {
            const funcName = getFunctionName(injectTarget) || 'undefined'
            metadata[`FUNCTIONAL_SERVICE_${funcName.toUpperCase()}`] = funcName
            defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
        } else {
            const injectMetadata = getMetadata(CLASS_ENVIRONMENTKEY, injectTarget) || {}
            if (injectMetadata) {
                Object.keys(injectMetadata).forEach((key) => {
                    metadata[key] = injectMetadata[key]
                })
                defineMetadata(CLASS_ENVIRONMENTKEY, { ...metadata }, target);
            }
        }

        [CLASS_DYNAMOTABLECONFIGURATIONKEY, CLASS_SNSCONFIGURATIONKEY].forEach(key => {
            const injectKeyConfig = (getMetadata(key, injectTarget) || [])
                .map(c => { return { ...c, injected: true } })
            const keyConfig = getMetadata(key, target) || []
            defineMetadata(key, [...keyConfig, ...injectKeyConfig], target);
        })
    }
}
