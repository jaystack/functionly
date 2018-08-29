import { CLASS_AWSMEMORYSIZEKEY, CLASS_AWSTIMEOUTKEY, CLASS_AWSRUNTIMEKEY } from '../../constants'
import { defineMetadata } from '../../metadata'

export enum AwsType {
  NodeJs6 = 'nodejs6.10',
  NodeJs8 = 'nodejs8.10'
}

export const aws = (config: {
    type?: string | AwsType,
    memorySize?: number,
    timeout?: number
}) => (target: Function) => {
    if (typeof config.type === 'string') {
        defineMetadata(CLASS_AWSRUNTIMEKEY, config.type, target);
    }
    if (typeof config.memorySize === 'number') {
        defineMetadata(CLASS_AWSMEMORYSIZEKEY, config.memorySize, target);
    }
    if (typeof config.timeout === 'number') {
        defineMetadata(CLASS_AWSTIMEOUTKEY, config.timeout, target);
    }
}
