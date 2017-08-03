export default ({ createContext, executor, ExecuteStep, projectConfig, requireValue }) => {
    return {
        commands({ commander }) {
            commander
                .command('deploy [target] [path]')
                .description('deploy functional services')
                .option('--aws-region <awsRegion>', 'AWS_REGION')
                .option('--aws-bucket <awsBucket>', 'aws bucket')
                .option('--stage <stage>', 'stage')
                .action(async (target, path, command) => {
                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const deployTarget = requireValue(target || projectConfig.deployTarget, 'missing deploy target')
                        const awsRegion = requireValue(command.awsRegion || projectConfig.awsRegion, 'awsRegion')
                        const awsBucket = command.awsBucket || projectConfig.awsBucket
                        const stage = command.stage || projectConfig.stage || 'dev'

                        process.env.FUNCTIONAL_ENVIRONMENT = deployTarget
                        process.env.FUNCTIONAL_STAGE = stage

                        const context = await createContext(entryPoint, {
                            deployTarget,
                            awsRegion,
                            awsBucket,
                            version: projectConfig.version,
                            projectName: projectConfig.name,
                            stage
                        })

                        await executor(context, ExecuteStep.get('CreateEnvironment'))

                        console.log(`done`)
                    } catch (e) {
                        console.log(`error`, e)
                    }
                });
        }
    }
}