import { CLASS_S3CONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { environment } from './environment'

export const S3_BUCKET_SUFFIX = '_S3_BUCKET'
export const S3_BUCKET_NAME_REGEXP = /^[a-z0-9][a-z0-9-.]{1,61}[a-z0-9]$/

export const s3Storage = (s3Config?: {
    bucketName?: string,
    environmentKey?: string,
    eventSourceConfiguration?: {
        Event?: any,
        Filter?: any
    },
    exists?: boolean
}) => (target: Function) => {
    let s3Definitions = getMetadata(CLASS_S3CONFIGURATIONKEY, target) || [];

    s3Config = s3Config || {}
    s3Config.bucketName = s3Config.bucketName || `%ClassName%-bucket`
    s3Config.environmentKey = s3Config.environmentKey || `%ClassName%${S3_BUCKET_SUFFIX}`

    const { templatedKey, templatedValue } = applyTemplates(s3Config.environmentKey, s3Config.bucketName, target)
    const lowerCaseTemplatedValue = templatedValue ? templatedValue.toLowerCase() : templatedValue

    if (!S3_BUCKET_NAME_REGEXP.test(lowerCaseTemplatedValue)) {
        throw new Error(`invalid bucket name '${lowerCaseTemplatedValue}' validator: ${S3_BUCKET_NAME_REGEXP}`)
    }

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
