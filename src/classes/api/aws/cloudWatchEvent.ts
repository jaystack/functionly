
import { Api } from '../../api'
import { constants, classConfig } from '../../../annotations'
const { CLASS_CLOUDWATCHEVENT } = constants

@classConfig({
    injectServiceEventSourceKey: CLASS_CLOUDWATCHEVENT
})
export class CloudWatchEvent extends Api { }
