import { normalize, join } from 'path'
const NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR
process.env.NODE_CONFIG_DIR = normalize(join(__dirname, '../../../../config'));
import * as _config from 'config'
if (typeof NODE_CONFIG_DIR == 'undefined') {
    delete process.env.NODE_CONFIG_DIR
} else {
    process.env.NODE_CONFIG_DIR = NODE_CONFIG_DIR
}

export const config = _config
