import * as webpack from 'webpack'
import { config } from '../../utilities/config'
import { basename, extname, join } from 'path'
import { lstat, readdirSync } from 'fs'
import { ExecuteStep } from '../core/executeStep'
import { executor } from '../core/executor'

import { projectConfig } from '../../project/config'

export class CodeCompile extends ExecuteStep {
    public async method(context) {
        const path = context.serviceRoot

        let isDir = await this.isDirectory(path)

        let files = [path]
        if (isDir) {
            files = await this.getJsFiles(path)
        }
        context.files = files

        await executor(context, bundle)

        return context
    }

    private getJsFiles(folder) {
        let files = readdirSync(folder);
        let filter = /\.js|\.ts$/
        return files.filter(name => filter.test(name)).map(file => join(folder, file))
    }
    private isDirectory(path) {
        return new Promise((resolve, reject) => {
            lstat(path, (err, stats) => {
                if (err) return reject(err);
                return resolve(stats.isDirectory())
            });
        })
    }

}

export const codeCompile = new CodeCompile('CodeCompile')

export const bundle = ExecuteStep.register('WebpackBundle', (context) => {
    return new Promise(async (resolve, reject) => {
        const webpackConfig = await executor(context, bundleConfig)
        let buildHash = ''

        const done = (err?, res?) => {
            const isWatch = context.watchCallback && webpackConfig.watch
            if (err) {
                if (isWatch) {
                    // watch mode, wait to fix
                    return
                }

                return reject(err)
            }

            if (isWatch) {
                context.watchCallback(context)
            } else {
                return resolve(res)
            }
        }

        try {
            webpack(webpackConfig, function (err, stats) {
                if (err) return done(err)

                if (buildHash === stats.hash) return
                if (buildHash && context.watchCallback) context.clearRequireCache = true
                buildHash = stats.hash

                let jsonStats = stats.toJson();
                if (jsonStats.errors.length > 0) {
                    console.log('WEBPACK ERROR')
                    jsonStats.errors.forEach(msg => console.log(msg))
                    return done(jsonStats.errors);
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

                done()
            });
        } catch (e) {
            return done(e)
        }
    })
})

export const bundleConfig = ExecuteStep.register('WebpackBundleConfig', async (context) => {
    let entry = {}
    context.files.forEach((file) => {
        let name = basename(file)
        const ext = extname(name)
        const nameKey = name.substring(0, name.length - ext.length)
        entry[nameKey] = file
    })

    const externals = {}
    if (context.deployTarget === 'aws') {
        externals['aws-sdk'] = 'commonjs aws-sdk'
    }

    let compile = {}
    if (projectConfig.compile) {
        compile = await executor({ context, projectConfig }, bundleCompileConfig)
    }
    let watch = {}
    if (context.watchCallback && projectConfig.watch) {
        watch = await executor({ context, projectConfig }, watchConfig)
    }

    const webpackConfig = {
        ...config.webpack,
        ...compile,
        ...watch,
        ...projectConfig.webpack,
        entry
    }

    webpackConfig.externals = { ...webpackConfig.externals, ...externals }

    if (!context.watchCallback && webpackConfig.watch) {
        delete webpackConfig.watch
    }

    return webpackConfig
})

export const bundleCompileConfig = ExecuteStep.register('WebpackCompileConfig', (context) => {
    switch (context.projectConfig.compile) {
        case "ts-loader":
            return {
                module: {
                    rules: [
                        {
                            test: /\.tsx?$/,
                            use: 'ts-loader',
                            exclude: /node_modules/
                        }
                    ]
                },
                resolve: {
                    extensions: ['.tsx', '.ts', '.js']
                }
            }
        case "babel-loader":
            return {
                module: {
                    rules: [
                        {
                            test: /\.jsx?$/,
                            use: 'babel-loader',
                            exclude: /node_modules/
                        }
                    ]
                }
            }
        default:
            return {}
    }
})

export const watchConfig = ExecuteStep.register('WebpackWatchConfig', (context) => {
    return {
        watch: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
            ignored: /dist/
        }
    }
})