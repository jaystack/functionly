import { CloudFormation } from 'aws-sdk'
import { pick } from 'lodash'
import { config } from '../../utilities/config'
import { ExecuteStep } from '../../context'


export const UPDATE_STACK_PRPERTIES = ['StackName', 'Capabilities', 'ClientRequestToken', 'Parameters', 'ResourceTypes', 'RoleARN', 'StackPolicyBody',
    'StackPolicyDuringUpdateBody', 'StackPolicyDuringUpdateURL', 'StackPolicyURL', 'Tags', 'UsePreviousTemplate'/*, 'TemplateBody', 'TemplateURL'*/]
export const CREATE_STACK_PRPERTIES = ['StackName', 'Capabilities', 'ClientRequestToken', 'DisableRollback', 'NotificationARNs', 'OnFailure', 'Parameters',
    'ResourceTypes', 'RoleARN', 'StackPolicyBody', 'StackPolicyURL', 'Tags', 'TimeoutInMinutes'/*, 'TemplateBody', 'TemplateURL'*/]

let cloudFormation = null;
const initAWSSDK = (context) => {
    if (!cloudFormation) {
        let awsConfig = { ...config.aws.CloudFormation }
        if (context.awsRegion) {
            awsConfig.region = context.awsRegion
        }

        cloudFormation = new CloudFormation(awsConfig);
    }
    return cloudFormation
}



export const createStack = ExecuteStep.register('CloudFormation-CreateStack', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        const cfConfig: any = pick(context.CloudFormationConfig, CREATE_STACK_PRPERTIES)
        const params = {
            ...cfConfig,
            TemplateBody: JSON.stringify(context.CloudFormationTemplate, null, 2)
        }

        cloudFormation.createStack(params, async (err, data) => {
            if (err) return reject(err)

            try {
                const result = await stackStateWaiter('CREATE_COMPLETE', context)
                resolve(result)
            } catch (e) {
                reject(e)
            }

        });
    })
})

export const updateStack = ExecuteStep.register('CloudFormation-UpdateStack', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        const cfConfig: any = pick(context.CloudFormationConfig, UPDATE_STACK_PRPERTIES)
        const params = {
            ...cfConfig,
            TemplateURL: `https://s3.eu-central-1.amazonaws.com/${context.awsBucket}/${context.S3CloudFormationTemplate}`,
            UsePreviousTemplate: false
        }

        cloudFormation.updateStack(params, async (err, data) => {
            if (err) return reject(err)

            try {
                const result = await stackStateWaiter('UPDATE_COMPLETE', context, 100)
                resolve(result)
            } catch (e) {
                reject(e)
            }

        });
    })
})

export const getTemplate = ExecuteStep.register('CloudFormation-GetTemplate', (context) => {
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
})

export const describeStackResouce = ExecuteStep.register('CloudFormation-DescribeStackResouce', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            StackName: context.CloudFormationConfig.StackName,
            LogicalResourceId: context.LogicalResourceId
        }

        cloudFormation.describeStackResource(params, function (err, data) {
            if (err) return reject(err)
            return resolve(data);
        });
    })
})

export const describeStacks = ExecuteStep.register('CloudFormation-DescribeStacks', (context) => {
    initAWSSDK(context)
    return new Promise((resolve, reject) => {
        let params = {
            StackName: context.CloudFormationConfig.StackName
        }

        cloudFormation.describeStacks(params, function (err, data) {
            if (err) return reject(err)
            const result = data.Stacks.find(s => s.StackName === context.CloudFormationConfig.StackName)
            return resolve(result);
        });
    })
})

export const stackStateWaiter = (status, context, tries = 20, timeout = 5000) => {
    const waitregexp = /_PROGRESS$/
    return new Promise((resolve, reject) => {
        let iteration = 0
        const waiter = () => {
            if (iteration >= tries) return reject(new Error(`stackStateWaiter timeout '${status}'`))
            iteration++
            setTimeout(async () => {
                const stack = await describeStacks.method(context)
                console.log(' >', stack.StackStatus)
                if (waitregexp.test(stack.StackStatus)) {
                    return waiter()
                }

                if (stack.StackStatus === status) {
                    return resolve(stack)
                }
                return reject(stack)
            }, timeout)
        }

        waiter()
    })
}