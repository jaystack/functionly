import { Hook } from './hook'
import { error, getMetadata, constants } from '../../annotations'
const { PARAMETER_PARAMKEY } = constants

export class PostHook extends Hook {
    public catch(...params);
    public catch( @error error) {
        throw error
    }


    public static onDefineMiddlewareTo(target) {
        super.onDefineMiddlewareTo(target)

        const targetTkey = 'catch'

        const injectedDefinitions: any[] = (getMetadata(PARAMETER_PARAMKEY, this, targetTkey) || [])
            .filter(p => p.type === 'inject')

        for (const { serviceType, targetKey, parameterIndex } of injectedDefinitions) {
            if (typeof serviceType.onDefineInjectTo === 'function') {
                serviceType.onDefineInjectTo(target, targetTkey, parameterIndex)
            }
        }
    }
}
