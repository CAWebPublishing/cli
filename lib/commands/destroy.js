import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import { spawn } from 'node:child_process';
import { v2 as dockerCompose } from 'docker-compose';

import { default as wpEnvDestroy } from '@wordpress/env/lib/commands/destroy.js';

/**
 * Internal dependencies
 */

/**
 * Promisified dependencies
 */

/**
 * Starts the development server.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * 
 */
export default async function destroy({
	spinner,
	scripts,
	debug,
}) {

	await wpEnvDestroy({spinner, scripts, debug });

	// wp-env destroy completed successfully if spinner.text reads.
	if( 'Removed WordPress environment.' === spinner.text ){
		// Stop phpMyAdmin as well
		// wp-env doesn't destroy the phpmyadmin image so we have to do it ourselves.
		await new Promise( (resolve, reject) => {
			const childProc = spawn(
				'docker',
				[
					'image',
					'rm',
					'phpmyadmin'
				],
				{ stdio: 'ignore' },
				spinner
			);

			childProc.on( 'error', reject );
			childProc.on( 'exit', ( code ) => {
				// Code 130 is set if the user tries to exit with ctrl-c before using
				// ctrl-d (so it is not an error which should fail the script.)
				if ( code === 0 || code === 130 ) {
					resolve();
				} else {
					reject( `Command failed with exit code ${ code }` );
				}
			} );
		});
		spinner.text = "Removed phpMyAdmin image.";

	}

}
