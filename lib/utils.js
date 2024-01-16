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
		).then( (result) => {
			if( 
				result &&
				typeof result === 'object' &&
				'exitCode' in result &&
				'err' in result &&
				'out' in result
			){
				// Remove the Container information and new lines.
				result.err = result.err.replace(/\s*Container .*Running\n|\n/g, '')
				result.out = result.out.replace(/\s*Container .*Running\n|\n/g, '')
				return result.out ? result.out : result.err
			}

			return result;
		});

}

/**
 * Runs command directly.
 * 
 * @param {string} 		cmd		Command to run.
 * @param {string[]} 	args	List of command arguments.
 * @param {string[]}  opts   List of spawn options.
 * @param {Object}   	spinner A CLI spinner which indicates progress.
 * @param {boolean}  debug   True if debug mode is enabled.
 * 
 * @returns {Promise}
 */
async function runCmd(cmd, args,spinner, opts = { stdio: 'pipe' },  debug = false){
	// fix various commands.
	switch (cmd) {
		case 'npm':
		case 'npx':
			/**
			 * On Windows we run npm.cmd, on Linux we run npm
			 */
			cmd += /^win/.test(process.platform) ? '.cmd' : '';
			break;
		case 'docker':
			break;
	}

	// save output for handling
	let output = opts.stdio;

	return  await new Promise( (resolve, reject) => {
		let result = [];
		const childProc = spawn(
			cmd,
			args,
			{
				...opts,
				stdio: 'pipe' // output is always piped and handled when stdout receives data.
			},
			spinner
	   	);
/*
		childProc.stdout.on( 'data', (data) => {
			// remove new lines from data
			data = data.toString().replace('\n', '');

			// push all data to results array if piping data
			if( '\n' !== data && '' !== data && data.length ){
				// output accordingly.
				switch( output ){
					case 'initial': // write output to spinner text
						spinner.text = data;
					case 'inherit': // write output to persistent spinner text
						spinner.stopAndPersist({
							text: data
						});
						break;
					case 'pipe': // save output to result array and output on exit
					default:
						result.push( data );
						break;
				}
			}
		});
		*/
		childProc.on( 'error', reject );
		childProc.on( 'exit', ( code ) => {
			// resolved with no issues return result array
			if ( code === 0 ) {
				resolve(result.join('\n'));
				// if there was an error 
			} else {
				if( debug ){
					// if debugging return exit code
					reject( `Command failed with exit code ${ code }` );
				}else{
					// resolve as false.
					resolve(false);
				}
			}
		} );
	   
   });

}

async function changePermissions( environment, config, path, spinner ){
	const {uid, gid } = getHostUser();
	return await runCLICmds( 
		environment, 
		[`sudo chown -Rf ${uid}:${gid} ${path}`], 
		config, 
		spinner
	);
}

export {
	runCLICmds,
	runCmd,
	changePermissions
};
