/**
 * External dependencies
 */
//const wpenv_cli = require('@wordpress/env/lib/cli');
import path from 'path';
import fs from 'fs';
import { Command, Argument, Option, InvalidArgumentError  } from 'commander';

/**
 * Internal dependencies
 */
import * as env from '../commands/index.js';

import {
	appPath,
	projectPath,
	withSpinner
} from './index.js';

const localFile = path.join(projectPath, 'package.json');
const pkg = JSON.parse( fs.readFileSync(localFile) );
const program = new Command();

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

const envArg = new Argument('[environment]', 'Which environment to use.')
	.choices([
		'development', 
		'tests', 
		'all'
	])
	.default('development');

	
/**
 * Adds commands for webpack
 */
function addWebpackCmds(){
  
	// Build Command.
	program.command('build')
	.description('Builds the current project.')
	.option(
		'--externals',
		'Bundles all dependencies into the build including externals.',
		false
	)
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(env.webpack)
	  
	
  // Serve Command.
  program.command('serve')
	.description('Serves the current project using CAWebPublishing templates.')
	.addOption(new Option('--template <template>', 'Serves the project using templating.').choices(['default', 'blank', '<local file>']).default('default').argParser( ( choice, t ) => {
		
		// if choice is a valid option return it.
		if( [ 'default', 'blank' ].includes( choice ) ){
			return choice;
		}

		// if choice is a valid local file return the absolute path.
		const localPath = path.resolve( choice );
		if( fs.existsSync( localPath ) ){
			return localPath;
		}

		// invalid option return error.
		throw new InvalidArgumentError('Allowed choices are default, blank, <local file>.');
	}))
	.addOption(new Option('--scheme <scheme>', 'Serves the project using template colorscheme.').choices([
		'delta',
		'eureka',
		'mono', 
		'oceanside', 
		'orangecounty',
		'pasorobles',
		'sacramento',
		'santabarbara',
		'santacruz',
		'shasta',
		'sierra',
		'trinity',
		'false'
	]).default('oceanside'))
	.option( '--no-audit', 'Skips WordPress CSS-Audit.', false )
	.option( '--no-a11y', 'Skips IBM Accessibility Checker.', false )
	.option( '--no-jshint', 'Skips JSHint.', false )
	.option( '--no-sitemap', 'Skips Sitemap generation.', false )
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(env.webpack)

  // a11y Command.
  program.command('a11y')
	.description('Runs accessibility checks.')
	.addArgument(new Argument('<url>', 'URL to scan for accessibility checks.'))
	.option( '--rule-archive <rule>', 'Specify the rule archive.', 'latest')
	.option( '--policies <policy...>', 'Specify one or many policies to scan.', ['WCAG_2_1'])
	.option( '--fail-levels <levels...>', 'Specify one or many violation levels on which to fail the test.', [
	  'violation',
	  'potentialviolation'
	])
	.option( '--report-levels <levels...>', 'Specify one or many violation levels that should be reported.', [
	  'violation', 
	  'potentialviolation',
	  'recommendation',
	  'potentialrecommendation',
	  'manual',
	  'pass'
	])
	.option( '--labels <label...>', 'Specify labels that you would like associated to your scan.', [])
	.option( '--output-format <format>', 'In which formats should the results be output.', ['html'])
	.option( '--output-filename <name>', 'Filename for the scan results.', 'a11y')
	.option( '--output-folder <folder>', 'Where the scan results should be saved.', 'a11y')
	.option( '--output-filename-timestamp', 'Should the timestamp be included in the filename of the reports?', false)
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(env.a11y)

	
  // audit Command.
  program.command('audit')
	.description('Runs WordPress CSS Audit tool against projects.')
	.addArgument(new Argument('[files...]', 'Files or directory path to CSS files.').default(['./build']))
	.option('--format [format]', 'Format to use for displaying report.', 'html' )
	.option('--filename [name]', 'If using a format that outputs to a file, specify the file name.', 'css-audit' )
	.option('--output-folder [path]', 'Where the audit should be saved.', 'audits' )
	.option('--colors', 'Runs colors audit.', true )
	.addOption(new Option('--no-colors', 'Skips colors audit.', false ).hideHelp())
	.option('--important', 'Runs !important audit.', true )
	.addOption(new Option('--no-important', 'Skips !important audit.', false ).hideHelp())
	.option('--display-none', 'Runs display: none audit.', true )
	.addOption(new Option('--no-display-none', 'Skips display: none audit.', false ).hideHelp())
	.option('--selectors', 'Runs selectors audit.', true )
	.addOption(new Option('--no-selectors', 'Skips selectors audit.', false ).hideHelp())
	.option('--media-queries', 'Runs media queries audit.', true )
	.addOption(new Option('--no-media-queries', 'Skips media queries audit.', false ).hideHelp())
	.option('--typography', 'Runs typography audit.', true )
	.addOption(new Option('--no-typography', 'Skips typography audit.', false ).hideHelp())
	.option('--property-values <values...>', 'Runs property value audit.', ['font-size', 'padding,padding-top,padding-bottom,padding-right,padding-left', 'margin,margin-top,marin-bottom,marin-right,marin-left'] )
	.addOption(new Option('--no-property-values', 'Skips property values audit.', false ).hideHelp())
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(env.audit)

  // JSHint Command.
  program.command('jshint')
	.description('Runs JSHint tool against projects.')
	.addArgument(new Argument('[files...]', 'Files or directory path to JS files.').default(['./src']))
	.option( '--output-filename <name>', 'Filename for the scan results.', 'jshint')
	.option( '--output-folder <folder>', 'Where the hint results should be saved.', 'jshint')
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(env.hint)
}


/**
 * Adds commands for wp-env 
 */
function addWPEnvCommands(){
	

	// Start command.
	program.command('start')
		.alias('launch')
		.description(
			`Starts two CAWebPublishing WordPress instances\ndevelopment on port http://localhost:8888 (override with WP_ENV_PORT)\ntests on port http://localhost:8889 (override with WP_ENV_TESTS_PORT).`
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
			'--spx', 
			'A simple profiling extension for PHP that provides low-overhead profiling with a built-in web UI.',
			''
		)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.option( 
			'--sync',
			'Will attempt to sync changes from a CAWebPublishing static site to this WordPress instance.',
			false
		)
		.option(
			'-p, --plugin',
			'True if root directory is a plugin.',
			false
		)
		.option(
			'-t, --theme',
			'True if root directory is a theme.',
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
		.allowExcessArguments(true)
		.action( withSpinner(env.start) )

	// Destroy Command.
	program.command('destroy')
		.alias('shutdown')
		.description(
			'Deletes docker containers, volumes, and networks associated with the CAWebPublishing instances and removes local files.'
		)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.destroy) )

	// Stop Command.
	program.command('stop')
		.description(
			'Stops running WordPress for development and tests and frees the ports.'
		)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.stop) )

	// Install Path Command.
	program.command('install-path')
		.description('Get the path where all of the environment files are stored. This includes the Docker files, WordPress, PHPUnit files, and any sources that were downloaded.')
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.installPath) )

	// Clean Command.
	program.command('clean')
		.description(
			'Cleans the WordPress databases.'
		)
		.addArgument(envArg)
		.option( 
			'--scripts', 
			'Execute any configured lifecycle scripts.',
			true
		)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
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
		.allowExcessArguments(true)
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
		.allowExcessArguments(true)
		.action( withSpinner(env.run) )


	// Shell Command.
	program.command('shell')
		.description('Open shell terminal in WordPress environment.')
		.addArgument(envArg)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.shell) )
		
}

/**
 * Adds commands for wp instances
 */
function addWPInstanceCommands(){
	// Sync changes from one WordPress instance to another.
	program.command('sync')
		.description('Sync changes from one WordPress instance to another.')
		.argument('[target]', 'Target Site URL, this is the site containing the latest changes.')
		.argument('[dest]', 'Destination Site URL, this is the site where the latest changes should go.')
		.addOption(new Option(
			'--interactive',
			'Runs the sync process with prompts'
		))
		.addOption(
			new Option(
				'-t,--tax <tax...>',
				'Taxonomy that should be synced. Default is full site sync.'
			)
			.choices(['media', 'menus', 'pages', 'posts', 'settings'])
			.default(['media', 'menus', 'pages', 'posts', 'settings'])
		)
		.addOption(new Option(
		'--media-ids <ids...>',
		'Sync specific Media IDs.'
		))
		.addOption(new Option(
		'--menu-ids <ids...>',
		'Sync specific Menu IDs.'
		))
		.addOption(new Option(
		'--page-ids <ids...>',
		'Sync specific Page IDs.'
		))
		.addOption(new Option(
		'--post-ids <ids...>',
		'Sync specific Post IDs.'
		))
		.option(
			'--debug',
			'Enable debug output.',
			false
		)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.sync) )
}

/**
 * Adds commands for blocks
 */
function addBlockCommands(){
	// Create a Gutenberg Block Command.
	program.command('create-block')
		.description('Scaffold for WordPress plugin to register Gutenberg Blocks.')
		.argument('<slug>', 'Plugin slug to use.')
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.createBlock) )

	// Update a Gutenberg Block Command.
	program.command('update-block')
		.description('Updates a Gutenberg Block.')
		.argument('<slug>', 'Plugin slug to update.')
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.updateBlock) )
}

/**
 * Adds commands for sites
 */
function addSiteCommands(){
	// Create a site command.
	program.command('create-site')
		.description('Creates a new CAWebPublishing Site Configuration file.')
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.addOption(new Option(
			'--site-title [title]',
			'Site Title'
			).default(path.basename( appPath ))
		)
		.addOption(new Option(
			'--silent,-s',
			'Runs the site creation process without prompts, this is useful for CI/CD pipelines.'
			).default(false)
		)
		.action( withSpinner(env.createSite) )
	

	// Convert a site command.
	program.command('convert-site')
		.description('Attempts to convert a site.')
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.addOption(new Option(
			'--builder [builder]',
			'Editor style to use for the pages.'
			).choices(['plain', 'divi', 'gutenberg']).default('wp')
		)
		.action( withSpinner(env.convertSite) )
}

export default function cli() {

	program
		.name('caweb')
		.usage( '<command>' )
		.description('Command Line Interface utilized by CAWebPublishing to accomplish several tasks.')
		.version( pkg.version )
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.configureHelp({ 
			sortSubcommands: true,
			sortOptions: true,
			showGlobalOptions: true,
		})
		.helpCommand(false)

	// Add Scripts command.
	program.command('gen-scripts')
		.description('Adds some general basic scripts commonly used in most projects to your package.json.')
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action( withSpinner(env.genScripts) )

	// Add Webpack specific commands.
	  addWebpackCmds()

	// Add wp-env specific commands.
	addWPEnvCommands();

	// Add wp-env specific commands.
	addWPInstanceCommands()

	// Add block specific commands.
	addBlockCommands()

	// Add site specific commands.
	addSiteCommands()
  
	
  // Test Command.
  // Ensure this is commented out.
  /*program.command('test')
	.description('Test commands on a WordPress environment')
	//.addArgument(envArg)
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(withSpinner(env.test))
  */

	return program;
};