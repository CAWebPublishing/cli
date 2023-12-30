/**
 * External dependencies
 */
import { spawn } from 'node:child_process';
import dockerCompose from 'docker-compose';
import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import getHostUser from '@wordpress/env/lib/get-host-user.js';
import { env } from 'node:process';


/**
 * Internal dependencies
 */

/**
 * Runs commands on the given WordPress environment.
 * 
 * @param {string}		environment	Which environment to run docker command on.
 * @param {string[]} 	cmds   		Array of commands to run.
 * @param {WPConfig} 	config      The wp-env config object.
 * @param {Object}   	spinner A CLI spinner which indicates progress.
 * 
 * @returns {Promise}
 */
async function runCLICmds(
	environment,
	cmds,
	config,
	spinner
) {

	// We return the promise whether there is an output or an error.
	return await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			[ 'bash', '-c', cmds.join( ' && ' ) ],
			{
				cwd: config.workDirectoryPath,
				commandOptions: [],
				log: config.debug,
				callback: (buffer, result) => {
					if( config.debug ){
						spinner.text = buffer.toString();
					}
				}
			}
		).then(
			(output) => {
				// Remove the Container information and new lines.
				output.err = output.err.replace(/\s*Container .*Running\n|\n/g, '')
				output.out = output.out.replace(/\s*Container .*Running\n|\n/g, '')

				return '' !== output.out ? output.out : output.err;
			},
			(error) => {
				// Remove the Container information and new lines.
				error.err = error.err.replace(/\s*Container .*Running\n|\n/g, '')

				return error;
			}
		);

}


export {
	runCLICmds
};
