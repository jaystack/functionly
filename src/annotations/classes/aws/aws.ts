import { CLASS_AWSMEMORYSIZEKEY, CLASS_AWSTIMEOUTKEY, CLASS_AWSRUNTIMEKEY } from '../../constants'
import { defineMetadata } from '../../metadata'
import { createClassDecorator, ObjectDecorator } from '../../decorators'

// export const aws = (config: {
//     type?: 'nodejs6.10',
//     memorySize?: number,
//     timeout?: number
// }) => (target: Function) => {
//     if (typeof config.type === 'string') {
//         defineMetadata(CLASS_AWSRUNTIMEKEY, config.type, target);
//     }
//     if (typeof config.memorySize === 'number') {
//         defineMetadata(CLASS_AWSMEMORYSIZEKEY, config.memorySize, target);
//     }
//     if (typeof config.timeout === 'number') {
//         defineMetadata(CLASS_AWSTIMEOUTKEY, config.timeout, target);
//     }
// }

export type AwsProps = { type?: 'nodejs6.10', memorySize?: number, timeout?: number }
export class AwsDecorator extends ObjectDecorator<AwsProps>{
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.aws = value
    }
}
export const aws = createClassDecorator<AwsProps>(new AwsDecorator({ type: 'nodejs6.10', memorySize: 3, timeout: 6 }))
