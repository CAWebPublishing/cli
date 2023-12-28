/**
 * External dependencies
 */
//const wpenv_cli = require('@wordpress/env/lib/cli');

import path from 'node:path';
import chalk from 'chalk';
import parseXdebugMode from '@wordpress/env/lib/parse-xdebug-mode.js';
import fs from 'fs-extra';
import terminalLink from  'terminal-link';
import { Command, Argument, Option } from 'commander';

/**
 * Internal dependencies
 */
import * as env from './commands/index.js';
import {
	wpPrimary,
	wpGreen,
	wpYellow,
	wpRed,
	withSpinner
} from './spinner.js';

const localPath = path.resolve( path.join(process.cwd(), 'node_modules/@caweb/cli/package.json') )
const pkg = JSON.parse( await fs.readFile(localPath) );
const program = new Command();

export default function cli() {
	const envArg = new Argument('[environment]', 'Which environment to use.')
		.choices([
			'development', 
			'tests', 
			'all'
		])
		.default('development');

	const containerArg = new Argument('<container>', 'The underlying Docker service to run the command on.')
		.choices([
			'mysql',
			'tests-mysql',
			'wordpress',
			'tests-wordpress',
			'cli',
			'tests-cli',
		])
		.default('development');

	program
		.name(wpPrimary( 'caweb'))
		.usage( wpYellow( '<command>' ) )
		.description('Command Line Interface utilized by CAWebPublishing to accomplish several tasks.')
		.version( pkg.version )
		.option(
			'--debug',
			'Enable debug output.',
			false
		)
		.allowUnknownOption(true)
		.configureHelp({ 
			sortSubcommands: true,
			sortOptions: true,
			showGlobalOptions: true,
		})
		.addHelpCommand(false)

	// Start command.
	program.command('start')
		.description(
			wpGreen(
				chalk`Starts two CAWebPublishing WordPress instances\ndevelopment on port ${ terminalLink( '8888', 'http://localhost:8888' ) } (override with WP_ENV_PORT)\ntests on port {bold.underline ${ terminalLink( '8889', 'http://localhost:8889' ) }} (override with WP_ENV_TESTS_PORT).\nAfter first install, use the '--update' flag to download updates to mapped sources and to re-apply CAWeb configuration options.`
			)
		)
		.option( 
			'--update',
			'Download source updates and apply WordPress configuration.',
			false
		)
		.option( 
			'--xdebug <mode>',
			'Enables Xdebug. If not passed, Xdebug is turned off. If no modes are set, uses "debug". You may set multiple Xdebug modes by passing them in a comma-separated list: `--xdebug=develop,coverage`. See https://xdebug.org/docs/all_settings#mode for information about Xdebug modes.',
		)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.option(
			'--bare',
			'True if excluding any downloads from CAWeb, use this if you want to use a local version of the CAWeb Theme, Configurations will still be applied.',
			false
		)
		.option(
			'-m, --multisite',
			'True if converting to multisite.',
			false
		)
		.option(
			'--subdomain',
			"If passed, the network will use subdomains, instead of subdirectories. Doesn't work with 'localhost', make sure to set Port to 80.",
			false
		)
		.allowUnknownOption(true)
		.action( withSpinner(env.start) )

	// Destroy Command.
	program.command('destroy')
		.description(
			wpRed(
				'Deletes docker containers, volumes, and networks associated with the CAWebPublishing instances and removes local files.'
			)
		)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.allowUnknownOption(true)
		.action( withSpinner(env.destroy) )

	// Shell Command.
	program.command('shell')
		.description('Open shell terminal in WordPress environment.')
		.addArgument(envArg)
		.allowUnknownOption(true)
		.action( withSpinner(env.shell) )

	// Stop Command.
	program.command('stop')
		.description(
			wpRed(
				'Stops running WordPress for development and tests and frees the ports.'
			)
		)
		.allowUnknownOption(true)
		.action( withSpinner(env.stop) )

	// Clean Command.
	program.command('clean')
		.description(
			wpYellow( 'Cleans the WordPress databases.' )
		)
		.addArgument(envArg)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.allowUnknownOption(true)
		.action( withSpinner(env.clean) )
	
	// Logs Command.
	program.command('logs')
		.description(
			'Displays PHP and Docker logs for given WordPress environment.'
		)
		.addArgument(envArg)
		.option( 
			'--no-watch', 
			'Stops watching for logs in realtime.',
			true
		)
		.allowUnknownOption(true)
		.action( withSpinner(env.logs) )
	
		
	// Run Command.
	program.command('run')
		.description(
			'Runs an arbitrary command in one of the underlying Docker containers. A double dash can be used to pass arguments to the container without parsing them. This is necessary if you are using an option that is defined below. You can use `bash` to open a shell session and both `composer` and `phpunit` are available in all WordPress and CLI containers. WP-CLI is also available in the CLI containers.'
		)
		.addArgument(containerArg)
		.argument('[command...]', 'The command to run.')
		.option( 
			'--env-cwd', 
			"The command's working directory inside of the container. Paths without a leading slash are relative to the WordPress root.",
			'.'
		)
		.allowUnknownOption(true)
		.action( withSpinner(env.run) )

		
	// Install Path Command.
	program.command('install-path')
		.description('Get the path where all of the environment files are stored. This includes the Docker files, WordPress, PHPUnit files, and any sources that were downloaded.')
		.allowUnknownOption(true)
		.action( withSpinner(env.installPath) )

	// Update Plugins Command.
	program.command('update-plugins')
		.description('Updates all plugins in the WordPress environment.')
		.argument('[slug]', 'Plugin slug to update.', 'all')
		.addOption(new Option('--environment <env>', 'Which environment to use.').choices(['development', 'tests']).default('development'))
		.allowUnknownOption(true)
		.action( withSpinner(env.updatePlugins) )

	// Test Command.
	// Ensure this is commented out.
	program.command('test')
		.description('Test commands on a WordPress environment')
		.addArgument(envArg)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.allowUnknownOption(true)
		.action(withSpinner(env.test))

	return program;
};
