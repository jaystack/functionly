import { CLASS_S3CONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { environment } from './environment'

export const S3_BUCKET_PREFIX = '_S3_BUCKET'

export const s3Storage = (s3Config: {
    bucketName: string,
    environmentKey?: string,
    eventSourceConfiguration?: {
        Event?: any,
        Filter?: any
    }
}) => (target: Function) => {
    let s3Definitions = getMetadata(CLASS_S3CONFIGURATIONKEY, target) || [];

    s3Config.environmentKey = s3Config.environmentKey || `%ClassName%${S3_BUCKET_PREFIX}`

    const { templatedKey, templatedValue } = applyTemplates(s3Config.environmentKey, s3Config.bucketName, target)
    const lowerCaseTemplatedValue = templatedValue ? templatedValue.toLowerCase() : templatedValue
    s3Definitions.push({
        ...s3Config,
        environmentKey: templatedKey,
        bucketName: lowerCaseTemplatedValue,
        definedBy: target.name
    })

    defineMetadata(CLASS_S3CONFIGURATIONKEY, [...s3Definitions], target)

    const environmentSetter = environment(templatedKey, lowerCaseTemplatedValue)
    environmentSetter(target)
}
