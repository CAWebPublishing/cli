/**
 * External dependencies
 */
import dockerCompose from 'docker-compose';
import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
const getHostUser = require( '../get-host-user' );

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
async function runCLICmds(
	environment,
	cmds,
	config
) {

	try {
		// Execute all commands in a batch.
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
			(warnings) => {
				// Remove the Container information and new lines.
				warnings.err = warnings.err.replace(/\s*Container .*Running\n|\n/g, '')

				if( 1 === warnings.exitCode ){
					//return warnings.err;
				}

				return false;
			}
		);

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
}


export {
	runCLICmds
};
