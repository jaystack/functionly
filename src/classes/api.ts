import { Resource } from './resource'
import { getFunctionName } from '../annotations/classes/functionName'
import { defineMetadata, getMetadata, constants, getClassConfigValue } from '../annotations'
const { CLASS_ENVIRONMENTKEY, CLASS_CLASSCONFIGKEY } = constants

export class Api extends Resource {
    constructor(...params) {
        super();
    }
    public async init(): Promise<any> {
        
    }

    public static ConfigEnvironmentKey: string

    public static onDefineInjectTo(target, targetKey, parameterIndex: number) {
        super.onDefineInjectTo(target, targetKey, parameterIndex)

        const configEnvironmentKey = getClassConfigValue('injectServiceCopyMetadataKey', this)
        if (configEnvironmentKey) {
            const injectKeyConfig = (getMetadata(configEnvironmentKey, this) || [])
                .map(c => { return { ...c, injected: true } })
            const keyConfig = getMetadata(configEnvironmentKey, target) || []
            defineMetadata(configEnvironmentKey, [...keyConfig, ...injectKeyConfig], target);
        }
    }

    public static toEventSource(target: Function) {
        const environmentKey = getClassConfigValue('injectServiceEventSourceKey', this)
        if (environmentKey) {
            const metadataCollection = getMetadata(environmentKey, target) || []

            const eventSourceConfigs = (getMetadata(environmentKey, this) || [])
                .map(config => { return { ...config, eventSource: true } })

            defineMetadata(environmentKey, [...metadataCollection, ...eventSourceConfigs], target)
        }
    }
}