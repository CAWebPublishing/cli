/**
 * External dependencies
 */
import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';

/**
 * Internal dependencies
 */
import {runCLICmds} from '../../utils.js';

/**
 * Promisified dependencies
 */

/**
 * Updates all plugins for a given environment.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {string} options.environment   Which environment to updated.
 */
export default async function updatePlugins({
	spinner,
	environment,
	slug
}) {

	spinner.text = "Updating plugins...";
	const config = await loadConfig(path.resolve('.'));

	let result = '';
	let plugin = 'all' === slug ? '--all' : slug;

	if( 'all' === environment ){
		result = await Promise.all( [
			runCLICmds( 'development', [`wp plugin update ${plugin}`], config ),
			runCLICmds( 'tests', [`wp plugin update ${plugin}`], config ),
		] );
	}else{
		result = await runCLICmds( 
				environment, 
				[`wp plugin update ${plugin}`], 
				config 
			);
	}

	spinner.prefixText = `${result}\n`;

	spinner.text = 'Completed updating plugins!'
	
};
