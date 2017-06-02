import { resolvePath } from '../../../utilities/cli'
import { projectConfig } from '../../../project/config'
import { ContextStep } from '../../../context'

export const cloudFormationInit = ContextStep.register('cloudFormationInit', async (context) => {
    context.CloudFormationConfig = projectConfig.CloudFormation || {}

    context.CloudFormationTemplate = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": {}
    }
})
