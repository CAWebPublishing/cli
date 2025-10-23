/**
 * @wordpress/env@10.33.0 Load Config Process converted to ECMAScript 
 */

/**
 * External dependencies
 */
import {stat} from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Internal dependencies
 */
import { md5 } from '../helpers.js';
const { parseConfig, getConfigFilePath } = require( './parse-config' );

/**
 * wp-env configuration.
 *
 * @typedef WPConfig
 * @property {string}                               name                    Name of the environment.
 * @property {string}                               configDirectoryPath     Path to the .wp-env.json file.
 * @property {string}                               workDirectoryPath       Path to the work directory located in ~/.wp-env.
 * @property {string}                               dockerComposeConfigPath Path to the docker-compose.yml file.
 * @property {boolean}                              detectedLocalConfig     If true, wp-env detected local config and used it.
 * @property {Object.<string, string>}              lifecycleScripts        Any lifecycle scripts that we might need to execute.
 * @property {Object.<string, WPEnvironmentConfig>} env                     Specific config for different environments.
 * @property {boolean}                              debug                   True if debug mode is enabled.
 */

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
		await stat( '/snap' );
		usesSnap = true;
	} catch {
		usesSnap = false;
	}

	return path.resolve( os.homedir(), usesSnap ? 'wp-env' : '.wp-env' );
};

/**
 * Checks to see whether or not there is any configuration present in the directory.
 *
 * @param {string[]} configFilePaths The config files we want to check for existence.
 *
 * @return {Promise<boolean>} A promise indicating whether or not a local config is present.
 */
async function hasLocalConfig( configFilePaths ) {
	for ( const filePath of configFilePaths ) {
		try {
			await stat( filePath );
			return true;
		} catch {}
	}

	return false;
}


/**
 * Loads any configuration from a given directory.
 *
 * @param {string} configDirectoryPath The directory we want to load the config from.
 *
 * @return {Promise<WPConfig>} The config object we've loaded.
 */
export default async function loadConfig( configDirectoryPath ) {
	const configFilePath = getConfigFilePath( configDirectoryPath );

	const cacheDirectoryPath = path.resolve(
		await getCacheDirectory(),
		md5( configFilePath )
	);

	// Parse any configuration we found in the given directory.
	// This comes merged and prepared for internal consumption.
	let config = await parseConfig( configDirectoryPath, cacheDirectoryPath );

	// Make sure to perform any additional post-processing that
	// may be needed before the config object is ready for
	// consumption elsewhere in the tool.
	config = postProcessConfig( config );

	return {
		name: path.basename( configDirectoryPath ),
		dockerComposeConfigPath: path.resolve(
			cacheDirectoryPath,
			'docker-compose.yml'
		),
		configDirectoryPath,
		workDirectoryPath: cacheDirectoryPath,
		detectedLocalConfig: await hasLocalConfig( [
			configFilePath,
			getConfigFilePath( configDirectoryPath, 'override' ),
		] ),
		lifecycleScripts: config.lifecycleScripts,
		env: config.env,
	};
}