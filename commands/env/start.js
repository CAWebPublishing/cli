/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import * as dockerCompose from 'docker-compose';
import yaml from 'js-yaml';

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
	configureWordPress,
	runCmd
} from '../../lib/index.js';
import wpEnvConfig from '../../configs/wp-env.js';
import dockerConfig from '../../configs/docker-compose.js';


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
	bare,
	plugin,
	theme,
	multisite,
	subdomain
}) {

	spinner.text = 'Writing configuration file...';
	
	// Write CAWeb .wp-env.json file.
	fs.writeFileSync(
		path.join(appPath, '.wp-env.json'),
		JSON.stringify( wpEnvConfig(bare, multisite, plugin, theme), null, 4 )
	);

	// Get current wp-env cache key
	const config = await loadConfig(path.resolve('.'));
	const { workDirectoryPath } = config;
	const cacheKey = await getCache(CONFIG_CACHE_KEY, {workDirectoryPath});
	
	// Set extra congiguration for WordPress.
	// Increase max execution time to 300 seconds.
	process.env.WORDPRESS_CONFIG_EXTRA = 'set_time_limit(300);';

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
		
		
	// Save pretext from wp-env if it exists for later.
	let preText = undefined !== spinner.prefixText ? spinner.prefixText.slice(0, -1) : '';

	// We aren't done lets clear the default WordPress text.			
	spinner.prefixText = '';
	spinner.text = '';

	// Download any resources required for CAWeb.
	if( shouldConfigureWp && ! bare ){
		await downloadSources({spinner, config});
	}
		
	// Write docker-compose.override.yml file to workDirectoryPath.
	fs.writeFileSync(
		path.join(workDirectoryPath, 'docker-compose.override.yml'),
		yaml.dump( dockerConfig(workDirectoryPath) )
	);

	// Only run configurations when config has changed.
	if( shouldConfigureWp ){

		// We need to bring the WordPress and CLI instances up again so they pick up
		// any config changes that may have been added to the docker-compose.override.yml.
		await dockerCompose.upMany(
			[
				'wordpress', 'tests-wordpress',
				'cli', 'tests-cli'
			], {
			cwd: workDirectoryPath,
			commandOptions: ['--build', '--force-recreate'],
			log: debug
		})

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

		// Create an Application Password for the user.
		/*
		const devAppPwd = await runCLICmd(
				'wp',
					[
						`user application-password create 1 caweb`,
						'--porcelain'
					]
				);
		*/
		
	}

	// Start phpMyAdmin Service.
	spinner.text = 'Starting phpMyAdmin Service';

	await dockerCompose.upOne(
		'phpmyadmin', 
		{
			cwd: workDirectoryPath,
			commandOptions: ['--build', '--force-recreate'],
			log: debug
		}
	)

	spinner.prefixText = preText + 
		`phpMyAdmin site started at http://localhost:8080\n\n`;


	spinner.text = 'Done!';

};
