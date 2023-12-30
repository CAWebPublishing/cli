/**
 * External dependencies
 */
import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';

/**
 * Internal dependencies
 */
import {runCLICmds} from '../../docker.js';

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

	let plugin = 'all' === slug ? '--all' : slug;

	let result = await runCLICmds( 
		environment, 
		[`wp plugin update ${plugin}`], 
		config 
	);

	spinner.prefixText = `${result}\n`;

	spinner.text = 'Completed updating plugins!'
	
};
