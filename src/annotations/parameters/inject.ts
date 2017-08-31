import { PARAMETER_PARAMKEY, CLASS_ENVIRONMENTKEY, CLASS_INJECTABLEKEY } from '../constants'
import { defineMetadata, getOwnMetadata, getOverridableMetadata } from '../metadata'
import { functionName } from '../classes/functionName'
import { injectable } from '../classes/injectable'
import { createClassDecorator, ArrayPropertyDecorator } from '../decorators'


// export const inject = (type: any, ...params): any => {
//     return (target, targetKey, parameterIndex: number) => {
//         if (!getOwnMetadata(CLASS_INJECTABLEKEY, type)) {
//             throw new Error(`type '${getFunctionName(type)}' not marked as injectable`)
//         }

//         const existingParameters: any[] = getOverridableMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];

//         existingParameters.push({
//             serviceType: type,
//             parameterIndex,
//             targetKey,
//             type: 'inject',
//             params
//         });

//         defineMetadata(PARAMETER_PARAMKEY, [...existingParameters], target, targetKey);

//         if (typeof type.onDefineInjectTo === 'function') {
//             type.onDefineInjectTo(target, targetKey, parameterIndex)
//         }
//     }
// }

export class InjectDecorator extends ArrayPropertyDecorator<Function>{
    public decorator(value, metadata, target, targetKey, parameterIndex) {
        if (!injectable.ownValue(target)) {
            throw new Error(`type '${functionName.value(value)}' not marked as injectable`)
        }

        const existingParameters: any[] = getOverridableMetadata(PARAMETER_PARAMKEY, target, targetKey) || [];

        const definition = {
            serviceType: value,
            parameterIndex,
            targetKey,
            type: 'inject'
        }

        defineMetadata(PARAMETER_PARAMKEY, [...existingParameters], target, targetKey);

        if (typeof value.onDefineInjectTo === 'function') {
            value.onDefineInjectTo(target, targetKey, parameterIndex)
        }

        return [definition, ...metadata]
    }
}
export const inject = createClassDecorator<Function>(new InjectDecorator())
