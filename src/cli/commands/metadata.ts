export default ({ createContext, executor, ExecuteStep, annotations: { getMetadata, getMetadataKeys }, projectConfig, requireValue }) => {

    return {
        commands({ commander }) {
            commander
                .command('metadata [target] [path]')
                .option('--stage <stage>', 'stage')
                .description('service metadata')
                .action(async (target, path, command) => {

                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const deployTarget = requireValue(target || projectConfig.deployTarget, 'missing deploy target')
                        const stage = command.stage || projectConfig.stage || 'dev'

                        process.env.FUNCTIONAL_ENVIRONMENT = deployTarget
                        process.env.FUNCTIONAL_STAGE = stage

                        const context = await createContext(entryPoint, {
                            deployTarget
                        })
                        await context.init()

                        await executor(context, ExecuteStep.get('ServiceMetadata'))

                        console.log(JSON.stringify(context.serviceMetadata, null, 4))

                        console.log(`done`)
                    } catch (e) {
                        console.log(`error`, e)
                    }
                });
        }
    }
}
