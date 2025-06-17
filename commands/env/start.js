/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import * as dockerCompose from 'docker-compose';

/**
 * WordPress dependencies
 */
import { default as wpEnvStart} from '@wordpress/env/lib/commands/start.js';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import retry from '@wordpress/env/lib/retry.js';
import { didCacheChange, getCache } from '@wordpress/env/lib/cache.js';
import { canAccessWPORG } from '@wordpress/env/lib/wordpress.js';

const CONFIG_CACHE_KEY = 'config_checksum';

/**
 * Internal dependencies
 */
import { 
	appPath,
	projectPath,
	configureCAWeb,
	downloadSources,
	generateCLIConfig,
	configureWordPress,
	runCmd,
	runCLICmds
} from '../../lib/index.js';

import { wpEnvConfig, wpEnvOverrideConfig } from '../../configs/wp-env.js';
import {default as SyncProcess} from '../sync/index.js';

/**
 * Starts the development server.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.update  If true, update sources.
 * @param {string}  options.xdebug  The Xdebug mode to set.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.sync   Will attempt to sync changes from a CAWebPublishing static site to this WordPress instance..
 * @param {boolean} options.bare   True if excluding any CAWeb Configurations.
 * @param {boolean} options.plugin   True if root directory is a plugin.
 * @param {boolean} options.theme   True if root directory is a theme.
 * @param {boolean} options.multisite   True if converting to multisite.
 * @param {boolean} options.subdomain   True if converting to multisite subdomain.
 * 
 */
export default async function start({
	spinner,
	update,
	xdebug,
	scripts,
	debug,
	sync,
	bare,
	plugin,
	theme,
	multisite,
	subdomain
}) {

	
	
	// Write CAWeb .wp-env.override.json file.
	if( ! fs.existsSync( path.join(appPath, '.wp-env.override.json')) ){
		spinner.stop()
	
		// Keys should not be saved in the repository so we store them in the override.json file.
		fs.writeFileSync(
			path.join(appPath, '.wp-env.override.json'),
			JSON.stringify( await wpEnvOverrideConfig(bare, multisite, subdomain, plugin, theme), null, 4 )
		);

		spinner.start('Writing .wp-env.override.json file...');

	}
	
	// Write CAWeb .wp-env.json file.
	if( ! fs.existsSync( path.join(appPath, '.wp-env.json')) || update ){
		spinner.stop()
		
		fs.writeFileSync(
			path.join(appPath, '.wp-env.json'),
			JSON.stringify( wpEnvConfig(bare, multisite, subdomain, plugin, theme), null, 4 )
		);

		spinner.start('Writing .wp-env.json file...');
	}

	// Get current wp-env cache key
	const config = await loadConfig(path.resolve('.'));
	const { workDirectoryPath } = config;
	const cacheKey = await getCache(CONFIG_CACHE_KEY, {workDirectoryPath});

	// Set extra configuration for WordPress.
	// Increase max execution time to 300 seconds.
	process.env.WORDPRESS_CONFIG_EXTRA = 'set_time_limit(300);';

	// we can enable phpMyAdmin since @wordpress/env:10.14.0
	if( config.env.development.config.WP_ENV_PHPMYADMIN_PORT ){
		process.env.WP_ENV_PHPMYADMIN_PORT = config.env.development.config.WP_ENV_PHPMYADMIN_PORT;	
	}
	if( config.env.tests.config.WP_ENV_TESTS_PHPMYADMIN_PORT ){
		process.env.WP_ENV_TESTS_PHPMYADMIN_PORT = config.env.tests.config.WP_ENV_TESTS_PHPMYADMIN_PORT;	
	}

	// wp-env launch.
	await wpEnvStart({
		spinner,
		update,
		xdebug,
		scripts,
		debug,
	})

	// Save pretext from wp-env if it exists for later.
	let preText = undefined !== spinner.prefixText ? spinner.prefixText.slice(0, -1) : '';

	// We aren't done lets clear the default WordPress text.			
	spinner.prefixText = '';
	spinner.text = '';

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
		// Download any resources required for CAWeb.
		if( ! bare ){
			spinner.text = 'Downloading CAWeb resources...';
			// Download sources for development and tests.
			await Promise.all( [
				downloadSources('development', {spinner, config}),
				downloadSources('tests', {spinner, config})
			] );
		}

		// Make additional WordPress Configurations.
		await Promise.all( [
			retry( () => configureWordPress( 'development', config, spinner, multisite, subdomain ), {
				times: 2,
			} ),
			retry( () => configureWordPress( 'tests', config, spinner, multisite, subdomain ), {
				times: 2,
			} )
		] );
		
		// Make CAWeb WordPress Configurations.
		await Promise.all( [
			retry( () => configureCAWeb( 'development', config, spinner ), {
				times: 2,
			} ),
			retry( () => configureCAWeb( 'tests', config, spinner ), {
				times: 2,
			} ),
		] );

		
		if( sync ){
			// sync any static information.
			spinner.text = `Syncing CAWebPublishing development Environment...`;
			// Sync the static site to the local WordPress instance.
			await SyncProcess({spinner, debug, target: 'static', dest: 'local'})
		}
		
	}

	spinner.prefixText = preText;


	spinner.text = 'Done!';
};
