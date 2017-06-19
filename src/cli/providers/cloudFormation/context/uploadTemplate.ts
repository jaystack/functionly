import { uploaderStep } from '../../../utilities/aws/s3Upload'
import { ExecuteStep, executor } from '../../../context'
import { projectConfig } from '../../../project/config'

export const uploadTemplate = ExecuteStep.register('UploadTemplate', async (context) => {
    for (const stackName in context.CloudFormationStacks) {
        const stack = context.CloudFormationStacks[stackName]
        if(!Object.keys(stack.Resources).length){
            delete context.CloudFormationStacks[stackName]
            delete context.CloudFormationTemplate.Resources[stackName]
        }
    }

    const templateData = JSON.stringify(context.CloudFormationTemplate, null, 2);
    const fileName = projectConfig.name ? `${projectConfig.name}.template` : 'cloudformation.template'
    const uploadresult = await executor(context, uploaderStep(fileName, templateData, 'application/octet-stream'))
    context.S3CloudFormationTemplate = uploadresult.Key

    for (const stackName in context.CloudFormationStacks) {
        const templateData = JSON.stringify(context.CloudFormationStacks[stackName], null, 2);
        const templateFileName = `${stackName}.template`
        const uploadresult = await executor(context, uploaderStep(templateFileName, templateData, 'application/octet-stream'))
    }

    return uploadresult
})