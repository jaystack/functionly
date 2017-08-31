import { createClassDecorator, PrimitiveDecorator } from '../decorators'

export class RoleDecorator extends PrimitiveDecorator<string>{ }
export const role = createClassDecorator<string>(new RoleDecorator())