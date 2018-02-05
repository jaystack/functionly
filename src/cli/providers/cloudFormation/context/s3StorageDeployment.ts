import { projectConfig } from '../../../project/config'

const S3_DEPLOYMENT_BUCKET_RESOURCE_NAME = 'FunctionlyDeploymentBucket'

export const getDeploymentBucketResourceName = async () => {
    return projectConfig.awsBucketResourceName || S3_DEPLOYMENT_BUCKET_RESOURCE_NAME
}

export const getBucketReference = async (context) => {
    return context.__userAWSBucket ? context.awsBucket : {
        "Ref": await getDeploymentBucketResourceName()
    }
}