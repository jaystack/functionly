import { CLASS_AZURENODEKEY } from '../../constants'
import { defineMetadata } from '../../metadata'

export const azure = (config: {
    node?: '6.5.0'
}) => (target: Function) => {
    if (typeof config.node === 'string') {
        defineMetadata(CLASS_AZURENODEKEY, config.node, target);
    }
}