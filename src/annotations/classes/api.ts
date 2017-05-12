// import { set, mergeWith, isArray } from 'lodash'
// import { FunctionalApi } from '../../classes/functionalApi'

// function customizer(objValue, srcValue) {
//   if (isArray(objValue)) {
//     return objValue.concat(srcValue);
//   }
// }

// export const api = (api: typeof FunctionalApi) => {
//     return (target: Function) => {
//         set(target, `__metadata`, mergeWith({}, api['__metadata'], target['__metadata'], customizer))
//     }
// }
