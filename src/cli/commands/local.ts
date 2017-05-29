import { local } from '../utilities/local'
import { createContext } from '../context'

export const init = (commander) => {
    commander
        .command('local <port> <path>')
        .description('run functional service local')
        .action(async (port, path, command) => {
            process.env.FUNCTIONAL_ENVIRONMENT = 'local'

            const context = await createContext(path, {
                deployTarget: 'local',
                localPort: port
            })

            try {
                await local(context)

                console.log(`done`)
            } catch (e) {
                console.log(`error`, e)
            }
        });
}