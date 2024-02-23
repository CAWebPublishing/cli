/**
 * External dependencies
 */
import path from 'path';
import spawn from 'cross-spawn';
import { fileURLToPath } from 'url';
import { sync as resolveBin } from 'resolve-bin';
import { v2 as dockerCompose } from 'docker-compose';

/**
 * Internal dependencies
 */

/**
 * Path Directory Locations
 * - currentPath - Current Directory
 * - projectPath - Current Project Path
 * - appPath - Current Application Path
 */
const currentPath = path.dirname(fileURLToPath(import.meta.url));
const projectPath = path.resolve( currentPath, '..' );
const appPath = path.resolve( projectPath, '../../../' );

/**
 * Runs command directly.
 * 
 * @param string 		cmd		Command to run.
 * @param string[] 	args	List of command arguments.
 * @param string[]  opts   List of spawn options.
 * 
 * @returns {Promise}
 */
async function runCmd(cmd, args,opts = { stdio: ['inherit', 'pipe'] }){
	// fix various commands.
	switch (cmd) {
		case 'npm':
		case 'npx':
			/**
			 * On Windows we run npm.cmd, on Linux we run npm
			 */
			cmd += /^win/.test(process.platform) ? '.cmd' : '';
			break;
		case 'webpack':
			cmd = resolveBin(cmd)
			break
	}

	return spawn.sync( cmd, args, {...opts, env: process.env});

}

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
			env: process.env,
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
	currentPath,
	projectPath,
	appPath,
	runCLICmds,
	runCmd
};