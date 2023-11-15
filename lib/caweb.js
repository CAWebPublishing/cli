'use strict';
/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const util = require( 'util' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const got = require( 'got' );
const dns = require( 'dns' ).promises;

/**
 * Promisified dependencies
 */
const copyDir = util.promisify( require( 'copy-dir' ) );

/**
 * Internal dependencies
 */


/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureCAWeb( environment, config, spinner ) {
	
	// -eo pipefail exits the command as soon as anything fails in bash.
	const setupCommands = [ 'set -eo pipefail' ];
	const {
		WP_DEFAULT_THEME
	} = config.env[ environment ].config;

	// Activate WP_DEFAULT_THEME.
	if( undefined !== config.env[ environment ].config.WP_DEFAULT_THEME ){
		let defaultTheme = typeof WP_DEFAULT_THEME === 'string' ? `"${ WP_DEFAULT_THEME }"` : WP_DEFAULT_THEME;

		setupCommands.push(
			`wp theme activate ${ defaultTheme }`
		);
	}
	
	// Execute all setup commands in a batch.
	await dockerCompose.run(
		environment === 'development' ? 'cli' : 'tests-cli',
		[ 'bash', '-c', setupCommands.join( ' && ' ) ],
		{
			config: config.dockerComposeConfigPath,
			commandOptions: [ '--rm' ],
			log: config.debug,
		}
	);
}

module.exports = {
	configureCAWeb
};
