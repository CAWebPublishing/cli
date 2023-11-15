'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const yaml = require( 'js-yaml' );
const fs = require( 'fs-extra' );
const dockerCompose = require( 'docker-compose' );
const installPath = require('@wordpress/env/lib/commands/install-path');
const util = require( 'util' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );

/**
 * Internal dependencies
 */
const {
	buildDockerComposeConfig
} = require('./configs');

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;
const exec = util.promisify( require( 'child_process' ).exec );

/**
 * Initialize config files for Docker Compose
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 */
const init =  async ({spinner}) => {
	// Write docker-compose.override.yml file.
	await writeFile(
		path.join(process.cwd(), 'docker-compose.override.yml'),
		yaml.dump( buildDockerComposeConfig() )
	);
};

/**
 * Start phpMyAdmin Docker Service.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 */
const start = async ({spinner}) => {
	// get wp-env install path.
	const config = await loadConfig( path.resolve( '.' ) );
	let workDirectoryPath = config.workDirectoryPath;
	let siteUrl = config.env.development.config.WP_SITEURL.replace(':8888', ':8080')

	// Move docker-compose.override.yml to wp-env workDirectoryPath.
	await fs.move(
		path.resolve('docker-compose.override.yml'), 
		path.join(workDirectoryPath, 'docker-compose.override.yml'),
		{
			overwrite: true
		}
	);

	// Start phpMyAdmin Service.
	spinner.text = 'Starting phpMyAdmin Service';

	await dockerCompose.upOne('phpmyadmin', {
		config: path.join(workDirectoryPath, 'docker-compose.override.yml'),
		commandOptions: ['--build', '--force-recreate']
	})

	spinner.prefixText = spinner.prefixText.slice(0, -1) + 
		`phpMyAdmin development site started at ${siteUrl}\n\n`;

}

module.exports = {
	init,
	start
}