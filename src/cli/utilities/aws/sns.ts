import { SNS } from 'aws-sdk'
import { config } from '../config'
import { __dynamoDBDefaults } from '../../../annotations'
import { ExecuteStep, executor } from '../../context'

let sns = null;
const initAWSSDK = (context) => {
    if (!sns) {
        let awsConfig = { ...config.aws.SNS }
        if (context.awsRegion) {
            awsConfig.region = context.awsRegion
        }

        if (context.deployTarget === 'local') {
            awsConfig.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000'
        }

        sns = new SNS(awsConfig);
    }
    return sns
}

export const getTopics = async (context) => {
    let data = await getTopicPage(context)
    const topics = [...data.Topics]
    while (data.NextToken) {
        data = await getTopicPage({ context, NextToken: data.NextToken })
        topics.push(...data.Topics)
    }
    return topics
}


export const getTopicPage = (context) => {
    const { NextToken } = context
    initAWSSDK(context)
    return new Promise<any>((resolve, reject) => {
        let params = {
            NextToken
        };
        sns.listTopics(params, function (err, data) {
            if (err) reject(err)
            else resolve(data);
        });
    })
}
