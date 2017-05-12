import { uploadServices } from '../providers'

export const deploy = async (context) => {
    await uploadServices(context)
}