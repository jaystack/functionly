var path = require('path')

module.exports = {
    aws: {
        S3: { apiVersion: '2006-03-01', signatureVersion: 'v4' },
        Lambda: { apiVersion: '2015-03-31', signatureVersion: 'v4' },
        DynamoDB: { apiVersion: '2012-08-10', signatureVersion: 'v4' },
        CloudFormation: { apiVersion: '2010-05-15', signatureVersion: 'v4' },
    },
    webpack: {
        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: "[name].js",
            libraryTarget: 'commonjs-module',
        },
        target: 'node'
    },
    tempDirectory: path.join(process.cwd(), 'dist'),
    S3: {
        ACL: 'public-read'
    }
}