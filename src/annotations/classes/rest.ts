import { expandableDecorator } from './expandableDecorator'

export const rest = expandableDecorator<{ path: string, methods?: string[], cors?: boolean, anonymous?: boolean }>({
    name: 'rest',
    defaultValues: {
        methods: ['get'],
        cors: false,
        anonymous: false
    }
})