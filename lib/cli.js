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
const env = require( './commands' );
const parseXdebugMode = require( '@wordpress/env/lib/parse-xdebug-mode' );

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
	yargs = wpenv_cli();

	// we are overwriting the default wp-env start command with our own.
	yargs.command(
		'start',
		wpGreen(
			chalk`Starts WordPress for development on port {bold.underline ${ terminalLink(
				'8888',
				'http://localhost:8888'
			) }} (override with WP_ENV_PORT) and tests on port {bold.underline ${ terminalLink(
				'8889',
				'http://localhost:8889'
			) }} (override with WP_ENV_TESTS_PORT). The current working directory must be a WordPress installation, a plugin, a theme, or contain a .wp-env.json file. After first install, use the '--update' flag to download updates to mapped sources and to re-apply WordPress configuration options.`
		),
		( args ) => {
			args.option( 'update', {
				type: 'boolean',
				describe:
					'Download source updates and apply WordPress configuration.',
				default: false,
			} );
			args.option( 'xdebug', {
				describe:
					'Enables Xdebug. If not passed, Xdebug is turned off. If no modes are set, uses "debug". You may set multiple Xdebug modes by passing them in a comma-separated list: `--xdebug=develop,coverage`. See https://xdebug.org/docs/all_settings#mode for information about Xdebug modes.',
				coerce: parseXdebugMode,
				type: 'string',
			} );
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
			args.option( 'bare', {
				type: 'boolean',
				describe: 'True if excluding any downloads from CAWeb, use this if you want to use a local version of the CAWeb Theme, Configurations will still be applied.',
				default: false,
			} );
			args.option( 'multisite', {
				alias: 'm',
				type: 'boolean',
				describe: 'True if converting to multisite.',
				default: false,
			} );
			
		},
		withSpinner( env.start )
	);

	// Shell Terminal Command.
	yargs.command(
		'shell [environment]',
		'Open shell terminal in WordPress environment.', 
		(args) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environment to open terminal in.",
				choices: [ 'development', 'tests' ],
				default: 'development',
			} );
		}, 
		withSpinner( env.shell )
	)

	// Shell Terminal Command.
	yargs.command(
		'update-plugins [environment]',
		'Updates all plugins in the WordPress environment.', 
		(args) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environment to update.",
				choices: [ 'development', 'tests' ],
				default: 'development',
			} );
		}, 
		withSpinner( env.updatePlugins )
	)

	// Test Command.
	yargs.command(
		'test [environment]',
		'Test commands on a WordPress environment', 
		(args) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environment to test in.",
				choices: [ 'development', 'tests' ],
				default: 'development',
			} );
			
			args.option( 'multisite', {
				alias: 'm',
				type: 'boolean',
				describe: 'True if converting to multisite.',
				default: false,
			} );
		}, 
		withSpinner( env.test )
	)
	
	return yargs;
};
