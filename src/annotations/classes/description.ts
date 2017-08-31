import { createClassDecorator, PrimitiveDecorator } from '../decorators'

export class DescriptionDecorator extends PrimitiveDecorator<string>{ }
export const description = createClassDecorator<string>(new DescriptionDecorator())