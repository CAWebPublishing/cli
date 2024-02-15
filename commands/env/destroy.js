
/**
 * External dependencies
 */
import { default as wpEnvDestroy } from '@wordpress/env/lib/commands/destroy.js';

/**
 * Internal dependencies
 */
import { runCmd } from '../../lib/index.js';

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
		await runCmd(
			'docker',
			[
				'image',
				'rm',
				'phpmyadmin'
			],
			{ stdio: 'ignore' }
		)
		
		spinner.text = "Removed WordPress environment.'";

	}

}
