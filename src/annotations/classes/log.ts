import { CLASS_LOGKEY } from '../constants'
import { defineMetadata } from '../metadata'
import { createClassDecorator, ObjectDecorator, applyParameter } from '../decorators'

// export const log = (config?) => (target: Function) => {
//     defineMetadata(CLASS_LOGKEY, true, target);
// }

export type LogProps = { [key: string]: any }
export class LogDecorator extends ObjectDecorator<LogProps>{ }
export const log = createClassDecorator<LogDecorator>(new LogDecorator({ enable: true }))