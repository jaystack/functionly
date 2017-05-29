import { environment } from '../../../annotations'

export const setFunctionalEnvironment = async (context) => {
    for (let serviceDefinition of context.publishedFunctions) {
        const setEnvAttrib = environment('FUNCTIONAL_ENVIRONMENT', context.FUNCTIONAL_ENVIRONMENT)
        setEnvAttrib(serviceDefinition.service)
    }
}