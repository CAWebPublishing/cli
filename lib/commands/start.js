/**
 * Modified from wp-env 8.11.0
 * @see @wordpress/env/lib/commands/start
 */
'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs-extra' );
const wpEnvStart = require('@wordpress/env/lib/commands/start');
const md5 = require('@wordpress/env/lib/md5');
const { didCacheChange } = require( '@wordpress/env/lib/cache' );
const {	
	checkDatabaseConnection, 
	canAccessWPORG 
} = require( '@wordpress/env/lib/wordpress' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );
const retry = require( '@wordpress/env/lib/retry' );


/**
 * Internal dependencies
 */
const { configureCAWeb } = require('../caweb');
const { 
	init: initPhpMyAdmin, 
	start: phpMyAdminStart 
} = require('../phpmyadmin');
const { buildWPEnvConfig } = require('../configs');
const {downloadSources } = require('../download-sources');

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;

/**
 * Starts the development server.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.update  If true, update sources.
 * @param {string}  options.xdebug  The Xdebug mode to set.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * 
 */
module.exports = async function start({
	spinner,
	update,
	xdebug,
	scripts,
	debug,
}) {
	// Divi Pre-check.

	// Build wp-env.json file.
	/*let wpEnvConfig = buildWPEnvConfig();
	
	// Write .wp-env.json file.
	await writeFile(
		path.join(process.cwd(), '.wp-env.json'),
		JSON.stringify( wpEnvConfig, null, 4 )
	);

	// Write docker-compose.override.yml file.
	await initPhpMyAdmin({spinner});

	// download CAWeb resources.
	await downloadSources({
		spinner
	});*/

	const config = await loadConfig(path.resolve('.'));
	const { workDirectoryPath, env } = config;
	const { development:dev, tests: test }  = env;

	// Check if the hash of the config has changed. If so, run configuration.
	const configHash = md5( config );
	const shouldConfigureWp =
		( update ||
			( await didCacheChange( 'config_checksum', configHash, {
				workDirectoryPath,
			} ) ) ) &&
		// Don't reconfigure everything when we can't connect to the internet because
		// the majority of update tasks involve connecting to the internet. (Such
		// as downloading sources and pulling docker images.)
		( await canAccessWPORG() );
	
	// wp-env launch.
	await wpEnvStart({
		spinner,
		update,
		xdebug,
		scripts,
		debug,
	});
	
	// clear wp-env start done text.
	spinner.text = '';

	if( shouldConfigureWp ){
		try {
			await checkDatabaseConnection( config );
		} catch ( error ) {
			// Wait 30 seconds for MySQL to accept connections.
			await retry( () => checkDatabaseConnection( config ), {
				times: 30,
				delay: 1000,
			} );

			// It takes 3-4 seconds for MySQL to be ready after it starts accepting connections.
			await sleep( 4000 );
		}

		spinner.text = 'Configuring CAWebPublishing Environments...';

		// Make CAWeb WordPress Configurations.
		await Promise.all( [
			retry( () => configureCAWeb( 'development', config, spinner ), {
				times: 2,
			} ),
			retry( () => configureCAWeb( 'tests', config, spinner ), {
				times: 2,
			} ),
		] );

	}

	// post wp-env launch actions.
	await phpMyAdminStart({spinner})

	spinner.text = 'Done!';

};
