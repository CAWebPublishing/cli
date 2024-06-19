#!/usr/bin/env node

/**
 * External dependencies
 */
import achecker from 'accessibility-checker';
import path from 'path';
import { isUrl } from 'check-valid-url';
import fs from 'fs';

/**
 * Internal dependencies
 */
// Our default A11y Checker Configuration 
import defaultConfig from '../configs/aceconfig.js';

import { 
    runCmd, 
} from '../lib/index.js';
import { stderr, stdout } from 'process';


/**
 * Run accessibility checks
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.url   True if debug mode is enabled.
 */
export default async function a11y({
	spinner,
	debug, 
    url
} ) {

    // Spinner not needed at the moment
	spinner.stop();

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
        url
    ];

    // run accessibility checker with our arguments.
    if( isUrl( url ) || fs.existsSync( url ) ){
        let outputDir = path.resolve('.',  outputFolder);
        let outputFileName = isUrl( url ) ?
            url.replace(/http[s]+:\/\//, '')
            :
            path.resolve(url).replace(':', '_');

        
        let reportFile = path.resolve(outputDir, outputFileName ) + '.html'

        await runCmd(
            'achecker', 
            acheckerArgs,
        ).then(({stderr, stdout}) => {
            console.log( reportFile );
        })

    }else{
        console.log( `${url} is not a valid url.` )
    }
    

};
