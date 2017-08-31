import { CLASS_SNSCONFIGURATIONKEY } from '../constants'
import { getMetadata, defineMetadata } from '../metadata'
import { applyTemplates } from '../templates'
import { environment } from './environment'
import { createClassDecorator, ArrayDecorator } from '../decorators'

export const SNS_TOPICNAME_SUFFIX = '_SNS_TOPICNAME'

// export const sns = (snsConfig: {
//     topicName: string,
//     environmentKey?: string
// }) => (target: Function) => {
//     let snsDefinitions = getMetadata(CLASS_SNSCONFIGURATIONKEY, target) || [];

//     snsConfig.environmentKey = snsConfig.environmentKey || `%ClassName%${SNS_TOPICNAME_SUFFIX}`

//     const { templatedKey, templatedValue } = applyTemplates(snsConfig.environmentKey, snsConfig.topicName, target)
//     snsDefinitions.push({
//         ...snsConfig,
//         environmentKey: templatedKey,
//         topicName: templatedValue,
//         definedBy: target.name
//     })

//     defineMetadata(CLASS_SNSCONFIGURATIONKEY, [...snsDefinitions], target)

//     const environmentSetter = environment(templatedKey, templatedValue)
//     environmentSetter(target)
// }

export type SnsProps = { tableName: string, environmentKey?: string, nativeConfig?: any }
export class SnsDecorator extends ArrayDecorator<SnsProps>{
    public decorator(value: SnsProps, metadata, target: Function) {

        value.environmentKey = value.environmentKey || `%ClassName%${SNS_TOPICNAME_SUFFIX}`

        const { templatedKey, templatedValue } = applyTemplates(value.environmentKey, value.tableName, target)
        const definitionValue = {
            ...value,
            environmentKey: templatedKey,
            topicName: templatedValue,
            definedBy: target.name
        }

        return [...metadata, definitionValue]
    }
    public metadata({ value, serviceDefinition, metadata }) {
        metadata.sns = metadata.sns || []
        let def = metadata.sns.find(d => d.tableName === value.tableName)
        if (!def) {
            def = value
            metadata.sns.push(def)
        }

        serviceDefinition.sns = serviceDefinition.sns || []
        serviceDefinition.sns.push(def)

    }
}
export const sns = createClassDecorator<SnsProps>(new SnsDecorator({}))
