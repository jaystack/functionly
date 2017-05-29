import { upload } from '../../../utilities/aws/s3Upload'

export const uploadTemplate = async (context) => {
    const templateData = JSON.stringify(context.CloudFormationTemplate, null, 2);
    const uploadresult = await upload(context, `services-${context.date.toISOString()}.template`, templateData, 'application/octet-stream')
    context.S3CloudFormationTemplate = uploadresult.Key
    return uploadresult
}