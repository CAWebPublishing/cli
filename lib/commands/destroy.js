
/**
 * External dependencies
 */
import { spawn } from 'node:child_process';
import { default as wpEnvDestroy } from '@wordpress/env/lib/commands/destroy.js';

/**
 * Destroys the development server.
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
		spinner.text = "Cleaning up...";
		
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
				if ( code === 0 ) {
					resolve();
				} else {
					reject( `Command failed with exit code ${ code }` );
				}
			} );
		});
		spinner.text = "Removed WordPress environment.'";

	}

}
