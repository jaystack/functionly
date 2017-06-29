import { Service } from './service'
import { getFunctionName } from '../annotations/classes/functionName'
import { defineMetadata, getMetadata, constants } from '../annotations'
const { CLASS_ENVIRONMENTKEY } = constants

export class InjectService extends Service {
    public static ConfigEnvironmentKey: string

    public static onDefineInjectTo(target, targetKey, parameterIndex: number) {
        super.onDefineInjectTo(target, targetKey, parameterIndex)

        if (this.ConfigEnvironmentKey) {
            const injectKeyConfig = (getMetadata(this.ConfigEnvironmentKey, this) || [])
                .map(c => { return { ...c, injected: true } })
            const keyConfig = getMetadata(this.ConfigEnvironmentKey, target) || []
            defineMetadata(this.ConfigEnvironmentKey, [...keyConfig, ...injectKeyConfig], target);
        }
    }
}