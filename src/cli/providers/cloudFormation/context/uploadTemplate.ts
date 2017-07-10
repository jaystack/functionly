import { uploaderStep } from '../../../utilities/aws/s3Upload'
import { writeFile } from '../../../utilities/local/file'
import { ExecuteStep, executor } from '../../../context'
import { projectConfig } from '../../../project/config'

export const persistCreateTemplate = ExecuteStep.register('PersistCreateTemplate', async (context) => {
    const templateData = JSON.stringify(context.CloudFormationTemplate, null, 2);
    const fileName = projectConfig.name ? `${projectConfig.name}.create.template.json` : 'cloudformation.create.template.json'
    writeFile(fileName, new Buffer(templateData, 'binary'))
})

export const uploadTemplate = ExecuteStep.register('UploadTemplate', async (context) => {
    for (const stackName in context.CloudFormationStacks) {
        const stack = context.CloudFormationStacks[stackName]
        if (!stack.Resources || !Object.keys(stack.Resources).length) {
            delete context.CloudFormationStacks[stackName]
            delete context.CloudFormationTemplate.Resources[stackName]
        }
    }

    const templateData = JSON.stringify(context.CloudFormationTemplate, null, 2);
    const fileName = projectConfig.name ? `${projectConfig.name}.template.json` : 'cloudformation.template.json'
    const uploadresult = await executor(context, uploaderStep(fileName, templateData, 'application/octet-stream'))
    context.S3CloudFormationTemplate = uploadresult.Key

    for (const stackName in context.CloudFormationStacks) {
        const templateData = JSON.stringify(context.CloudFormationStacks[stackName], null, 2);
        const templateFileName = `${stackName}.template.json`
        const uploadresult = await executor(context, uploaderStep(templateFileName, templateData, 'application/octet-stream'))
    }

    return uploadresult
})