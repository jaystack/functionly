export default ({ createContext, contextSteppes: { createEnvironment }, projectConfig, requireValue }) => {
    return {
        commands({ commander }) {
            commander
                .command('deploy [target] [path]')
                .description('deploy functional services')
                .option('--aws-region <awsRegion>', 'AWS_REGION')
                .option('--aws-bucket <awsBucket>', 'aws bucket')
                .action(async (target, path, command) => {
                    process.env.FUNCTIONAL_ENVIRONMENT = 'deploy'

                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const deployTarget = requireValue(target || projectConfig.deployTarget, 'missing deploy target')
                        const awsRegion = requireValue(command.awsRegion || projectConfig.awsRegion, 'awsRegion')
                        const awsBucket = command.awsBucket || projectConfig.awsBucket

                        const context = await createContext(entryPoint, {
                            deployTarget,
                            awsRegion,
                            awsBucket,
                            version: projectConfig.version
                        })

                        await context.runStep(createEnvironment)

                        console.log(`done`)
                    } catch (e) {
                        console.log(`error`, e)
                    }
                });
        }
    }
}