/**
 * External dependencies
 */
import path from 'path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import * as dockerCompose from 'docker-compose';

import { default as wpEnvStop } from '@wordpress/env/lib/commands/stop.js';

/**
 * Starts the development server.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * 
 */
export default async function stop({
	spinner,
	debug,
}) {
	const config = await loadConfig(path.resolve('.'));
	const { workDirectoryPath } = config;

	// Stop wp-env services
	await wpEnvStop({spinner, debug });

	// Stop phpMyAdmin as well
	await dockerCompose.down( {
		config: path.join(workDirectoryPath, 'docker-compose.override.yml'),
		log: debug,
	} );

}
