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
const util = require( 'util' );
const { didCacheChange, getCache } = require( '@wordpress/env/lib/cache' );
const {	
	checkDatabaseConnection, 
	canAccessWPORG 
} = require( '@wordpress/env/lib/wordpress' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );
const retry = require( '@wordpress/env/lib/retry' );
const yaml = require( 'js-yaml' );
const dockerCompose = require( 'docker-compose' );

const CONFIG_CACHE_KEY = 'config_checksum';

/**
 * Internal dependencies
 */
const { configureCAWeb } = require('../caweb');
const { buildWPEnvConfig, buildDockerComposeConfig } = require('../configs');
const {downloadSources } = require('../download-sources');

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;
const sleep = util.promisify( setTimeout );

/**
 * Starts the development server.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.update  If true, update sources.
 * @param {string}  options.xdebug  The Xdebug mode to set.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.bare   True if excluding any CAWeb Configurations.
 * 
 */
module.exports = async function start({
	spinner,
	update,
	xdebug,
	scripts,
	debug,
	bare
}) {
	spinner.text = 'Writing configuration file...';
	
	// Write CAWeb .wp-env.json file.
	await writeFile(
		path.join(process.cwd(), '.wp-env.json'),
		JSON.stringify( buildWPEnvConfig({bare}), null, 4 )
	);

	// Get current wp-env cache key
	const config = await loadConfig(path.resolve('.'));
	const { workDirectoryPath } = config;
	const cacheKey = await getCache(CONFIG_CACHE_KEY, {workDirectoryPath});
	
	// wp-env launch.
	await wpEnvStart({
		spinner,
		update,
		xdebug,
		scripts,
		debug,
	})

	// Check if we should configure settings.
	const shouldConfigureWp = ( update || 
		( await didCacheChange( CONFIG_CACHE_KEY, cacheKey, {
			workDirectoryPath,
		} ) )) &&
		// Don't reconfigure everything when we can't connect to the internet because
		// the majority of update tasks involve connecting to the internet. (Such
		// as downloading sources and pulling docker images.)
		( await canAccessWPORG() );
		
		
	// Only run configurations when config has changed.
	if( shouldConfigureWp ){

		try {
			// We aren't don't lets clear the default WordPress text.			
			spinner.text = '';

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

		// Download any resources required for CAWeb.
		if( ! bare ){
			await downloadSources({spinner, config});
		}
				
		// Write docker-compose.override.yml file to workDirectoryPath.
		await writeFile(
			path.join(workDirectoryPath, 'docker-compose.override.yml'),
			yaml.dump( buildDockerComposeConfig(workDirectoryPath) )
		);

		// Start phpMyAdmin Service.
		spinner.text = 'Starting phpMyAdmin Service';

		// We need to bring the WordPress instances up again so they pick up
		// any config changes that may have been added to the docker-compose.override.yml.
		await dockerCompose.upMany(
			[
				'phpmyadmin','tests-phpmyadmin',
				'wordpress', 'tests-wordpress',
				'cli', 'tests-cli'
			], {
			cwd: workDirectoryPath,
			commandOptions: ['--build', '--force-recreate'],
			log: debug
		})

		// Save pretext from wp-env if it exists.
		let preText = undefined !== spinner.prefixText ? spinner.prefixText.slice(0, -1) : '';
		spinner.prefixText = preText + 
			`phpMyAdmin development site started at http://localhost:8080\n` +
			`phpMyAdmin development site started at http://localhost:9090\n\n`;

		spinner.text = 'Configuring CAWebPublishing Environments...';

		// Make CAWeb WordPress Configurations.
		if( ! bare ) {
			await Promise.all( [
				retry( () => configureCAWeb( 'development', config, spinner ), {
					times: 2,
				} ),
				retry( () => configureCAWeb( 'tests', config, spinner ), {
					times: 2,
				} ),
			] );
		}
		
		spinner.text = 'Done!';

	}

};
