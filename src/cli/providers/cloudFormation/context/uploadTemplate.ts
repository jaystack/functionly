import { uploaderStep } from '../../../utilities/aws/s3Upload'
import { ContextStep } from '../../../context'

export const uploadTemplate = ContextStep.register('uploadTemplate', async (context) => {
    const templateData = JSON.stringify(context.CloudFormationTemplate, null, 2);
    const uploadresult = await context.runStep(uploaderStep(`services-${context.date.toISOString()}.template`, templateData, 'application/octet-stream'))
    context.S3CloudFormationTemplate = uploadresult.Key
    return uploadresult
})