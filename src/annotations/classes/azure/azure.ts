import { CLASS_AZURENODEKEY } from '../../constants'
import { defineMetadata } from '../../metadata'
import { createClassDecorator, ObjectDecorator } from '../../decorators'

// export const azure = (config: {
//     node?: '6.5.0'
// }) => (target: Function) => {
//     if (typeof config.node === 'string') {
//         defineMetadata(CLASS_AZURENODEKEY, config.node, target);
//     }
// }

export type AzureProps = { node?: '6.5.0' }
export class AzureDecorator extends ObjectDecorator<AzureProps>{
    public metadata({ value, serviceDefinition }) {
        serviceDefinition.azure = value
    }
}
export const azure = createClassDecorator<AzureProps>(new AzureDecorator({ node: '6.5.0' }))
