export const S3_DEPLOYMENT_BUCKET_RESOURCE_NAME = 'FunctionlyDeploymentBucket'

export const getBucketReference = async (context) => {
    return context.__userAWSBucket ? context.awsBucket : {
        "Ref": S3_DEPLOYMENT_BUCKET_RESOURCE_NAME
    }
}