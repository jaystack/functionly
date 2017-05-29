import { CloudFormation } from 'aws-sdk'
import { merge, pick } from 'lodash'
import { config } from '../../utilities/config'


export const UPDATE_STACK_PRPERTIES = ['StackName', 'Capabilities', 'ClientRequestToken', 'Parameters', 'ResourceTypes', 'RoleARN', 'StackPolicyBody',
    'StackPolicyDuringUpdateBody', 'StackPolicyDuringUpdateURL', 'StackPolicyURL', 'Tags', 'UsePreviousTemplate'/*, 'TemplateBody', 'TemplateURL'*/]
export const CREATE_STACK_PRPERTIES = ['StackName', 'Capabilities', 'ClientRequestToken', 'DisableRollback', 'NotificationARNs', 'OnFailure', 'Parameters',
    'ResourceTypes', 'RoleARN', 'StackPolicyBody', 'StackPolicyURL', 'Tags', 'TimeoutInMinutes'/*, 'TemplateBody', 'TemplateURL'*/]

let cloudFormation = null;
const initAWSSDK = (context) => {
    if (!cloudFormation) {
        let awsConfig = merge({}, config.aws.CloudFormation)
        if (context.awsRegion) {
            awsConfig.region = context.awsRegion
        }

        cloudFormation = new CloudFormation(awsConfig);
    }
    return cloudFormation
}



export const createStack = (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        const cfConfig = pick(context.CloudFormationConfig, CREATE_STACK_PRPERTIES) 
        const params = merge({}, cfConfig, {
            TemplateURL: `https://s3.eu-central-1.amazonaws.com/${context.awsBucket}/${context.S3CloudFormationTemplate}`
        })

        cloudFormation.createStack(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const updateStack = (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        const cfConfig = pick(context.CloudFormationConfig, UPDATE_STACK_PRPERTIES)
        const params = merge({}, cfConfig, {
            TemplateURL: `https://s3.eu-central-1.amazonaws.com/${context.awsBucket}/${context.S3CloudFormationTemplate}`,
            UsePreviousTemplate: false
        })

        cloudFormation.updateStack(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}

export const getTemplate = (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            StackName: context.CloudFormationConfig.StackName
        }

        cloudFormation.getTemplate(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}