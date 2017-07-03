import { CLASS_CLASSCONFIGKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { simpleClassAnnotation } from './simpleAnnotation'

export const eventSource = (...eventSourceTargets) => {
    return (target: Function) => {
        for (const eventSourceTarget of eventSourceTargets) {
            if (eventSourceTarget && typeof eventSourceTarget.toEventSource === 'function') {
                eventSourceTarget.toEventSource(target)
            }
        }
    }
}
