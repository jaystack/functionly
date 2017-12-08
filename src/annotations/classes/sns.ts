import { CLASS_SNSCONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { environment } from './environment'

export const sns = (snsConfig?: {
    topicName?: string,
    environmentKey?: string
}) => (target: Function) => {
    let snsDefinitions = getMetadata(CLASS_SNSCONFIGURATIONKEY, target) || [];

    snsConfig = snsConfig || {}
    snsConfig.topicName = snsConfig.topicName || `%ClassName%-topic`
    snsConfig.environmentKey = snsConfig.environmentKey || `%ClassName%_SNS_TOPICNAME`

    const { templatedKey, templatedValue } = applyTemplates(snsConfig.environmentKey, snsConfig.topicName, target)
    snsDefinitions.push({
        ...snsConfig,
        environmentKey: templatedKey,
        topicName: templatedValue,
        definedBy: target.name
    })

    defineMetadata(CLASS_SNSCONFIGURATIONKEY, [...snsDefinitions], target)

    const environmentSetter = environment(templatedKey, templatedValue)
    environmentSetter(target)
}
