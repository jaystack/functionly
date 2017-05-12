var path = require('path')

module.exports = {
    aws: {
        S3: { apiVersion: '2006-03-01', region: "eu-central-1" },
        Lambda: { apiVersion: '2015-03-31', region: "eu-central-1" }
    },
    webpack: {
        output: {
            path: path.join(__dirname, '../dist'),
            filename: "[name].js",
            libraryTarget: 'commonjs-module',
        },
        target: 'node'
    },
    S3: {
        Bucket: 'molinio-lambda',
        ACL: 'public-read'
    }
}