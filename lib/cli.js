'use strict';
/**
 * External dependencies
 */
const wpenv_cli = require('@wordpress/env/lib/cli');

const chalk = require( 'chalk' );
const ora = require( 'ora' );
let yargs = require( 'yargs' );
const terminalLink = require( 'terminal-link' );
const { execSync } = require( 'child_process' );

/**
 * Internal dependencies
 */
const pkg = require( '../package.json' );
const env = require( './env' );
/*
const parseXdebugMode = require( './parse-xdebug-mode' );
const {
	RUN_CONTAINERS,
	validateRunContainer,
} = require( './validate-run-container' );
*/
// Colors.
const boldWhite = chalk.bold.white;
const wpPrimary = boldWhite.bgHex( '#00669b' );
const wpGreen = boldWhite.bgHex( '#4ab866' );
const wpRed = boldWhite.bgHex( '#d94f4f' );
const wpYellow = boldWhite.bgHex( '#f0b849' );

// Spinner.
const withSpinner =
	( command ) =>
	( ...args ) => {
		const spinner = ora().start();
		args[ 0 ].spinner = spinner;
		let time = process.hrtime();
		return command( ...args ).then(
			( message ) => {
				time = process.hrtime( time );
				spinner.succeed(
					`${ message || spinner.text } (in ${ time[ 0 ] }s ${ (
						time[ 1 ] / 1e6
					).toFixed( 0 ) }ms)`
				);
				process.exit( 0 );
			},
			( error ) => {
				if( error ){
					// Error is an unknown error. That means there was a bug in our code.
					spinner.fail(
						typeof error === 'string' ? error : error.message
					);
					// Disable reason: Using console.error() means we get a stack trace.
					console.error( error );
					process.exit( 1 );
				}else{
					spinner.fail( 'An unknown error occurred.' );
					process.exit( 1 );
				}
			}
		);
	};

module.exports = function cli() {
	// Do nothing if Docker is unavailable.
	try {
		execSync( 'docker info', { stdio: 'ignore' } );
	} catch {
		console.error(
			chalk.red( 'Could not connect to Docker. Is it running?' )
		);
		process.exit( 1 );
	}
	
	yargs = wpenv_cli();
	
	yargs.command(
		'start',
		'*', 
		(args) => {
		}, 
		withSpinner( env.start )
	)

	yargs.command(
		'ssh [environment]',
		'SSH into the WordPress environment.', 
		(args) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environment to ssh into.",
				choices: [ 'development', 'tests' ],
				default: 'development',
			} );
		}, 
		withSpinner( env.ssh )
	)

	yargs.command(
		'test',
		'Test commands', 
		(args) => {
		}, 
		withSpinner( env.test )
	)
	
	
	return yargs;
};
