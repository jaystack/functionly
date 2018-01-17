import { CLASS_CLOUDWATCHEVENT } from '../../constants'
import { getMetadata, defineMetadata } from '../../metadata'
import { rest } from '../rest'

export const cloudWatchEvent = (config: { scheduleExpression?: string, eventPattern?: any }) => {
    return (target: Function) => {
        let metadata = getMetadata(CLASS_CLOUDWATCHEVENT, target) || []
        metadata.push({
            ...config,
            definedBy: target.name
        })
        defineMetadata(CLASS_CLOUDWATCHEVENT, [...metadata], target);
    }
}