import * as webpack from 'webpack'
import { config } from './config'
import { basename, extname, join } from 'path'
import { ExecuteStep, executor } from '../context'


export const bundle = ExecuteStep.register('WebpackBundle', (context) => {

    return new Promise(async (resolve, reject) => {
        const webpackConfig = await executor(context, bundleConfig)

        webpack(webpackConfig, function (err, stats) {
            if (err) return reject()

            let jsonStats = stats.toJson();
            if (jsonStats.errors.length > 0) {
                console.log('WEBPACK ERROR')
                console.log(jsonStats.errors)
                return reject(jsonStats.errors);
            }
            // if (jsonStats.warnings.length > 0) {
            //     console.log('WEBPACK WARNINGS')
            //     console.log(jsonStats.warnings)
            // }

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
})

export const bundleConfig = ExecuteStep.register('WebpackBundleConfig', (context) => {
    let entry = {}
    context.files.forEach((file) => {
        let name = basename(file)
        const ext = extname(name)
        const nameKey = name.substring(0, name.length - ext.length)
        entry[nameKey] = file
    })

    const externals = []
    if (context.deployTarget === 'aws') {
        externals.push({
            'aws-sdk': 'commonjs aws-sdk'
        })
    }

    const webpackConfig = {
        ...config.webpack,
        entry: entry,
        externals
    }

    return webpackConfig
})