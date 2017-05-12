#!/usr/bin/env node

import * as commander from 'commander'
import './utilities/config'
var packageJson = require('../../../package.json')

import { init } from './index'

commander
    .version(packageJson.version)

init(commander)


commander.parse(process.argv);
