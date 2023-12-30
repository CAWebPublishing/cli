/**
 * External dependencies
 */
import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';

/**
 * Internal dependencies
 */
import { runCLICmds } from '../docker.js';
import { activateCAWeb } from '../caweb.js';

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
		
		let result = await runCLICmds(
			'development', 
			['wp --version'], 
			config, 
			spinner
		)


		console.log( result );

		spinner.text = "Done!";
	
};
