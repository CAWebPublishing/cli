/**
 * External dependencies
 */
import path from 'path';
import chalk from 'chalk';
import spawn from 'cross-spawn';
import { fileURLToPath } from 'url';
import { sync as resolveBin } from 'resolve-bin';
import * as dockerCompose from 'docker-compose';
import { promisify } from 'util';
import crypto from 'crypto';

/**
 * Internal dependencies
 */

/**
 * Path Directory Definitions
 * - currentPath - This files current location in the current project.
 */
const currentPath = path.dirname(fileURLToPath(import.meta.url));

/**
 * Path Directory Definitions
 * - projectPath - The cli project path in the current project.
 */
const projectPath = path.resolve( currentPath, '..' );

/**
 * Path Directory Definitions
 * - appPath - Current Project Working Directory
 */
const appPath = process.cwd();

/**
 * Runs command directly.
 * 
 * @param string 		cmd		Command to run.
 * @param string[] 	args	List of command arguments.
 * @param string[]  opts   List of spawn options.
 * 
 * @returns {Promise}
 */
async function runCmd(cmd, args,opts = { stdio: 'pipe' }){
	// fix various commands.
	switch (cmd) {
		case 'npm':
		case 'npx':
			/**
			 * On Windows we run npm.cmd, on Linux we run npm
			 */
			cmd += /^win/.test(process.platform) ? '.cmd' : '';
			break;
		case 'auditor':
			cmd = 'node ' + resolveBin('@caweb/cli', {executable: 'auditor'} )
			break;	
		case 'achecker':
			cmd = resolveBin('accessibility-checker', {executable: 'achecker'})
			break;	
		case 'webpack':
			cmd = resolveBin(cmd)
			break;
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
async function runCLICmds({
	environment,
	cmds,
	cwd,
	debug = false
}) {

	// We return the promise whether there is an output or an error.
	return await dockerCompose.run(
		environment === 'development' ? 'cli' : 'tests-cli',
		[ 'bash', '-c', cmds.join( ' && ' ) ],
		{
			cwd,
			env: process.env,
			commandOptions: [],
			log: debug,
			callback: (buffer, result) => {
				// Remove the Container information and new lines.
				if ( 'stdout' === result && debug ){
					// process.stdout.write( buffer.toString().replace(/\s*Container .*Running\n/g, '') );
					// writeLine(buffer.toString().replace(/\s*Container .*Running\n|\n/g, ''), { color: 'red' });
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
			error.err = error.err.replace(/\s*Container .*Running\n/g, '')

			writeError(error.err);

			if( debug ){
				process.exit(1);
			}else{
				return false;
			}
		}
	);
}

/**
 * Write a line to the console.
 *
 * @param {string} text Text to write.
 * @param {string} opts.color Color of the text.
 * @param {string} opts.prefix Prefix of the text.
 * @param {string} opts.bold Bold text.
 * @param {string} opts.char Character to use for the border.
 * @param {string} opts.borderColor Character border color.
 */
function writeLine(text, options = {}) {
	let defaults = {
		color: 'white', 
		prefix: '', 
		bold: false,
		char: '', 
		borderColor: 'white'
	}

	// combine the defaults with the opts
	let opts = {
		...defaults,
		...options
	}

	let {
		color, prefix, bold,char, borderColor
	} = opts;

	// set border options first
	if( char ) {
		// set border color
		char = chalk[borderColor]( char );

		// set bold
		char = bold ? chalk.bold(char) : char;

		// border repetition
		char = char.repeat(text.length) + '\n';
	}

	// Add a prefix to the text if it is not empty.
	text = prefix ? prefix + ' ' + text : text;

	// Add a bold to the text if it is not empty.
	text = bold ? chalk.bold(text) : text;

	// Add a color to the text if it is not empty.
	text = chalk[color](text);

	// add a border to the top of the text if it is not empty.
	// add a border to the bottom of the text if it is not empty.
	
	process.stdout.write(char + text + '\n' + char);
}

/**
 * Write an error to the console.
 *
 * @param {string} text 
 */
function writeError(text) {
	process.stderr.write(text + '\n');
}

/**
 * Clear lines from the console
 * @param {int} count Number of lines to clear.
 */
function clearLine(count = 1) {
	do {
		// process.stdout.write("\r\x1b[K");
		process.stdout.moveCursor(0, -1) // up one line
  		process.stdout.clearLine(1) // from cursor to end
	} while (--count);
}


/**
 * Hashes the given string using the MD5 algorithm.
 *
 * @param {any} data The data to hash. If not a string, converted with JSON.stringify.
 * @return {string} An MD5 hash string.
 */
function md5( data ) {
	const convertedData =
		typeof data === 'string' ? data : JSON.stringify( data );

	return crypto.createHash( 'md5' ).update( convertedData ).digest( 'hex' );
}

export {
	currentPath,
	projectPath,
	appPath,
	runCmd,
	runCLICmds,
	writeLine,
	writeError,
	clearLine,
	md5,
};