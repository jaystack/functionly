import { merge } from 'lodash'
import * as webpack from 'webpack'
import { config } from './config'
import { basename, extname, join } from 'path'


export const bundle = (context) => {

    return new Promise((resolve, reject) => {
        const webpackConfig = createConfig(context)

        webpack(webpackConfig, function (err, stats) {
            if (err) return reject()

            let jsonStats = stats.toJson();
            if (jsonStats.errors.length > 0) {
                console.log('WEBPACK ERROR')
                console.log(jsonStats.errors)
                return reject(jsonStats.errors);
            }
            if (jsonStats.warnings.length > 0) {
                console.log('WEBPACK WARNINGS')
                console.log(jsonStats.warnings)
            }

            context.originalFiles = context.files
            context.files = []
            Object.keys(jsonStats.entrypoints).forEach((entryKey) => {
                let entry = jsonStats.entrypoints[entryKey]
                let assets = entry.assets.map((file) => join(webpackConfig.output.path, file))
                context.files.push(...assets)
            })

            resolve()
        });
    })
}

export const createConfig = (context) => {
    let entry = {}
    context.files.forEach((file) => {
        let name = basename(file)
        const ext = extname(name)
        const nameKey = name.substring(0, name.length - ext.length)
        entry[nameKey] = file
    })

    const webpackConfig = merge({}, config.webpack, {
        entry: entry,
        externals: [
            {
                'aws-sdk': 'commonjs aws-sdk'
            }
        ]
    })

    return webpackConfig
}