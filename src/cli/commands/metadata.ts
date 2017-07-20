export default ({ createContext, executor, ExecuteStep, annotations: { getMetadata, getMetadataKeys }, projectConfig, requireValue }) => {

    return {
        commands({ commander }) {
            commander
                .command('metadata [target] [path]')
                .description('service metadata')
                .action(async (target, path, command) => {

                    try {
                        const entryPoint = requireValue(path || projectConfig.main, 'entry point')
                        const deployTarget = requireValue(target || projectConfig.deployTarget, 'missing deploy target')

                        process.env.FUNCTIONAL_ENVIRONMENT = deployTarget

                        const context = await createContext(entryPoint, {
                            deployTarget
                        })

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
