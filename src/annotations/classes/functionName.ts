import { CLASS_NAMEKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { createClassDecorator, PrimitiveDecorator } from '../decorators'
// import { simpleClassAnnotation } from './simpleAnnotation'


// export const functionName = simpleClassAnnotation<string>(CLASS_NAMEKEY)

export class FunctionNameDecorator extends PrimitiveDecorator<string>{
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.name = value
    }

    public getValue(target) {
        const value = super.getValue(target)
        if (value) {
            return value
        }
        if (target instanceof Function) {
            return target.name
        }
        if (target && target.constructor && target.constructor.name) {
            return target.constructor.name
        }

        throw new Error(`name not resolvable on '${target}'`)
    }
}

const _decorator = new FunctionNameDecorator()
export const functionName = createClassDecorator<string>(_decorator)

export const getFunctionName = (target) => {
    console.log('TODO: refactor getFunctionName')
    return functionName.value(target)
}