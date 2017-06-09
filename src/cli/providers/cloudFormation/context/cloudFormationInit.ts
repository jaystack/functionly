import { resolvePath } from '../../../utilities/cli'
import { projectConfig } from '../../../project/config'
import { ContextStep } from '../../../context'

import { merge } from 'lodash'

export const cloudFormationInit = ContextStep.register('cloudFormationInit', async (context) => {
    context.CloudFormationConfig = merge({}, {
        StackName: projectConfig.name,
        OnFailure: "ROLLBACK",
        TimeoutInMinutes: 10
    }, projectConfig.cloudFormation)

    context.CloudFormationTemplate = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": {},
        "Outputs": {}
    }
})
