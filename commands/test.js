/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import os from 'os';

//var WP = require('wp-cli');
/**
 * Internal dependencies
 */
import { runCLICmds, runCmd, projectPath } from '../lib/index.js';
import { CAWEB_OPTIONS, DIVI_OPTIONS } from '../lib/wordpress/index.js';
/**
 * Promisified dependencies
 */

/**
 * Test code.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to test in.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function test({
	spinner,
	debug,
	environment
} ) {
	
	spinner.text = "Testing Code Functionality";
	const config = await loadConfig(path.resolve('.'));
	const { workDirectoryPath } = config;	
	process.env.WP_CLI_CONFIG_PATH  = path.join(config.workDirectoryPath, 'config.yml');

	let cawebOptNames = CAWEB_OPTIONS;

	let result = await runCmd(
                    'php',
                    [
						//'--info'
                    ]
                )

			
	console.log( 'out', result.stdout.toString() );
	console.log( 'err', result.stderr.toString() );
		
};
