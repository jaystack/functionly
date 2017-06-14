import { uploaderStep } from '../../../utilities/aws/s3Upload'
import { ContextStep } from '../../../context'
import { projectConfig } from '../../../project/config'

export const uploadTemplate = ContextStep.register('UploadTemplate', async (context) => {
    const templateData = JSON.stringify(context.CloudFormationTemplate, null, 2);
    const localName = projectConfig.name ? `${projectConfig.name}.template` : 'cloudformation.template'
    const uploadresult = await context.runStep(uploaderStep(`services-${context.date.toISOString()}.template`, templateData, 'application/octet-stream', localName))
    context.S3CloudFormationTemplate = uploadresult.Key
    return uploadresult
})