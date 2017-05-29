import { resolvePath } from '../../../utilities/cli'

export const cloudFormationInit = async (context) => {
    const path = resolvePath('./package.json')
    try {
        const packageJson = require(path)
        context.CloudFormationConfig = packageJson.CloudFormation || {}
    } catch (e) {
        context.CloudFormationConfig = {}
    }

    context.CloudFormationTemplate = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": {}
    }
}