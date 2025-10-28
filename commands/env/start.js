/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import deepmerge from 'deepmerge';
import os from 'os';

/**
 * WordPress dependencies
 */
import WPEnv from '@wordpress/env';

/**
 * Internal dependencies
 */
import { 
	appPath,
	md5
} from '../../lib/index.js';

import { wpEnvConfig, wpEnvOverrideConfig } from '../../configs/wp-env.js';
import {default as SyncProcess} from '../sync/index.js';

/**
 * Gets the directory in which generated files are created.
 *
 * By default: '~/.wp-env/'. On Linux with snap packages: '~/wp-env/'. Can be
 * overridden with the WP_ENV_HOME environment variable.
 *
 * @return {Promise<string>} The absolute path to the `wp-env` home directory.
 */
async function getCacheDirectory() {
	// Allow user to override download location.
	if ( process.env.WP_ENV_HOME ) {
		return path.resolve( process.env.WP_ENV_HOME );
	}

	/**
	 * Installing docker with Snap Packages on Linux is common, but does not
	 * support hidden directories. Therefore we use a public directory when
	 * snap packages exist.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/20180#issuecomment-587046325
	 */
	let usesSnap;
	try {
		fs.statSync( '/snap' );
		usesSnap = true;
	} catch {
		usesSnap = false;
	}

	return path.resolve( os.homedir(), usesSnap ? 'wp-env' : '.wp-env' );
}

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
	spx,
	sync,
	plugin,
	theme,
	multisite,
	subdomain
}) {
	let configFilePath = path.resolve( appPath, '.wp-env.json' );
	let configOverrideFilePath = path.resolve( appPath, '.wp-env.override.json' );

	// taken from @wordpress/env source code so we can get the working directory path before the env starts.
	const workDirectoryPath = path.resolve(
		await getCacheDirectory(),
		md5( configFilePath )
	);

	// Keys should not be saved in the repository so we store them in the override.json file.
	// Write CAWeb .wp-env.override.json file.
	if( ! fs.existsSync( configOverrideFilePath ) ){
		spinner.stop()
	
		fs.writeFileSync(
			configOverrideFilePath,
			JSON.stringify( await wpEnvOverrideConfig({workDirectoryPath, multisite, subdomain, plugin, theme}), null, 4 )
		);

		spinner.start('Writing .wp-env.override.json file...');

	}else {
		let overrideConfig = JSON.parse( fs.readFileSync( configOverrideFilePath ) );

		// if the override file doesn't have Divi credentials prompt for them again.
		if( ! overrideConfig.config.ET_USERNAME || ! overrideConfig.config.ET_API_KEY ){
			spinner.stop()

			let diviConfig = await wpEnvOverrideConfig({workDirectoryPath, multisite, subdomain, plugin, theme});

			fs.writeFileSync(
				configOverrideFilePath,
				JSON.stringify( deepmerge( overrideConfig, diviConfig ), null, 4 )
			);

			spinner.start('Writing .wp-env.override.json file...');
		} 
	}
	
	// Write CAWeb .wp-env.json file.
	spinner.stop()
		
	fs.writeFileSync(
		configFilePath,
		JSON.stringify( await wpEnvConfig({workDirectoryPath, multisite, subdomain, plugin, theme}), null, 4 )
	);

	spinner.start('Writing .wp-env.json file...');

	// Set extra configuration for WordPress.
	// Increase max execution time to 300 seconds.
	process.env.WORDPRESS_CONFIG_EXTRA = 'set_time_limit(300);';

	// wp-env launch.
	await WPEnv.start({
		spinner,
		update,
		xdebug,
		spx,
		scripts,
		debug,
	})

	if( sync ){
		// Save pretext from wp-env if it exists for later.
		let preText = undefined !== spinner.prefixText ? spinner.prefixText.slice(0, -1) : '';

		// We aren't done lets clear the default WordPress text.			
		spinner.prefixText = '';
		
		// sync any static information.
		spinner.text = `Syncing CAWebPublishing development Environment...`;
		// Sync the static site to the local WordPress instance.
		await SyncProcess({spinner, debug, target: 'static', dest: 'local'})

		// Restore pretext.
		spinner.prefixText = preText;
	}

	spinner.text = 'Done!';
};
