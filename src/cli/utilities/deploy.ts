import { createEnvironment } from '../providers'

export const deploy = async (context) => {
    await createEnvironment(context)
}