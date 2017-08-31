import { CLASS_INJECTABLEKEY } from '../constants'
import { defineMetadata } from '../metadata'
import { createClassDecorator, PrimitiveDecorator, applyParameter } from '../decorators'

// export const injectable = (target: Function) => {
//     defineMetadata(CLASS_INJECTABLEKEY, true, target);
// }

export class InjectableDecorator extends PrimitiveDecorator<boolean>{ }
export const _injectable = createClassDecorator<boolean>(new InjectableDecorator())
export const injectable = applyParameter(_injectable, true)