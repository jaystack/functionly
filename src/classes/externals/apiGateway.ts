
import { InjectService } from '../injectService'
import { constants, classConfig } from '../../annotations'
const { CLASS_APIGATEWAYKEY } = constants

@classConfig({
    injectServiceEventSourceKey: CLASS_APIGATEWAYKEY
})
export class ApiGateway extends InjectService { }
