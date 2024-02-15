#!/usr/bin/env node

/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import resolveBin from 'resolve-bin';

/**
 * Internal dependencies
 */
// Our default A11y Checker Configuration 
import defaultConfig from '../configs/aceconfig.js';

import { 
    runCmd, 
} from '../lib/index.js';



/**
 * Run accessibility checks
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function a11y({
	spinner,
	debug, 
} ) {

    // Spinner not needed at the moment
	spinner.stop()
    const {
        ruleArchive,
        policies,
        failLevels,
        reportLevels,
        outputFolder,
        outputFormat,
        outputFilenameTimestamp
    } = defaultConfig;

    
    // pass any arguments from the cli
    // overwriting our default config flags.
    // users can overwrite any values by creating a .achecker.yml or aceconfig.js.
    let acheckerArgs = [
        '--ruleArchive',
        ruleArchive,
        '--policies',
        Array.isArray(policies) ? policies.join(',') : policies,
        '--failLevels',
        Array.isArray(failLevels) ? failLevels.join(',') : failLevels,
        '--reportLevels',
        Array.isArray(reportLevels) ? reportLevels.join(',') : reportLevels,
        '--outputFolder',
        outputFolder,
        '--outputFormat',
        outputFormat,
        '---outputFilenameTimestamp',
        outputFilenameTimestamp,
        process.argv.pop()
    ];

    // run webpack with our arguments.
    await runCmd(
		'achecker', 
		acheckerArgs, 
	)

};
