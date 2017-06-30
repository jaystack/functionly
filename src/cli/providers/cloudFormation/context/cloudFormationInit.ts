import { resolvePath } from '../../../utilities/cli'
import { projectConfig } from '../../../project/config'
import { ExecuteStep } from '../../../context'

import { defaultsDeep } from 'lodash'

export const cloudFormationInit = ExecuteStep.register('CloudFormationInit', async (context) => {
    context.CloudFormationConfig = {
        StackName: projectConfig.name,
        OnFailure: "ROLLBACK",
        TimeoutInMinutes: 10,
        ...projectConfig.cloudFormation
    }

    context.CloudFormationTemplate = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": {},
        "Outputs": {}
    }
    context.CloudFormationStacks = {}
    context.deploymentResources = []
})

export const cloudFormationMerge = ExecuteStep.register('CloudFormationAfterCreateDefaults', async (context) => {
    defaultsDeep(context.CloudFormationTemplate, projectConfig.cloudFormationTemplate || {})
    defaultsDeep(context.CloudFormationStacks, projectConfig.cloudFormationStacksTemplate || {})
})