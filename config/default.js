var path = require('path')

module.exports = {
    aws: {
        S3: { apiVersion: '2006-03-01', signatureVersion: 'v4' },
        Lambda: { apiVersion: '2015-03-31', signatureVersion: 'v4' }
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
        ACL: 'public-read'
    }
}