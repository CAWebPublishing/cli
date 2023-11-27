'use strict';
/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const path = require( 'path' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );


/**
 * Internal dependencies
 */

/**
 * Runs commands on the given WordPress environment.
 * 
 * @param {string}		environment	Which environment to run docker command on.
 * @param {string[]} 	cmds   		Array of commands to run.
 * @param {WPConfig} 	config      The wp-env config object.
 * 
 * @returns {Object}
 */
async function runDockerCmds(
	environment,
	cmds,
	config
) {

	try {
		// Execute all setup commands in a batch.
		return await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			[ 'bash', '-c', cmds.join( ' && ' ) ],
			{
				cwd: config.workDirectoryPath,
				commandOptions: [ '--rm' ],
				log: config.debug,
			}
		).then(
			(output) => {
				// Remove the Container information and new lines.
				output.err = output.err.replace(/\s*Container .*Running\n|\n/g, '')
				output.out = output.out.replace(/\s*Container .*Running\n|\n/g, '')

				return '' !== output.out ? output.out : output.err;
			},
			(output) => {
				// Remove the Container information and new lines.
				output.err = output.err.replace(/\s*Container .*Running\n|\n/g, '')

				return false;
			}
		);

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
}


module.exports = {
	runDockerCmds
};
