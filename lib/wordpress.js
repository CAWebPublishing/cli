'use strict';
const { writeFile } = require('fs-extra');
const path = require( 'path' );
/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
const {runDockerCmds} = require('./docker');

/**
 * Checks whether WordPress environment is a multisite installation.
 * 
 * @param {string}		environment	Which environment to check for multisite installation.
 * @param {WPConfig}    config      The wp-env config object.
 * @returns 
 */
async function isMultisite( environment, config ){
	return await runDockerCmds(
		environment,
		[ 'wp config get MULTISITE' ],
		config
	)
}

/**
 * Transforms an existing single-site installation into a multisite installation.
 * 
 * @param {string} environment Which environment to convert into a multisite installation.
 * @param {WPConfig} config The wp-env config object.
 * @param {boolean} subdomain   True if converting to multisite subdomain.
 * @returns 
 */
async function convertToMultisite( environment, config, subdomain ){
	// before we can conver to multisite all plugins must be deactivated.
	// first lets get all plugins
	let activePlugins = await runDockerCmds(
		environment,
		['wp option get active_plugins --format=json'],
		config
	)

	activePlugins = Object.values(JSON.parse( activePlugins ));

	// deactivate all active plugins.
	if( activePlugins.length ){
		await runDockerCmds(
			environment,
			['wp plugin deactivate ' + activePlugins.join(' ')],
			config
		)
	}
	
	// convert to multisite.
	let command = 'wp core multisite-convert';

	if( subdomain ){
		command += ' --subdomains'
	}

	await runDockerCmds(
		environment, 
		[command],
		config
	)

	// generate .htaccess
	await generateHTAccess( environment, config.workDirectoryPath, subdomain );

	// network activate all active plugins again.
	if( activePlugins.length ){
		await runDockerCmds(
			environment,
			['wp plugin activate ' + activePlugins.join(' ') + ' --network'],
			config
		)
	}

}

/**
 * Generates .htaccess file content.
 * 
 * @param {string} environment Which environment to generate .htaccess for.
 * @param {boolean} subdomain True if converting to multisite subdomain.
 */
async function generateHTAccess(environment, workDirectoryPath, subdomain){
	let trailingSlash = subdomain ? '^wp-admin$ wp-admin/ [R=301,L]' : '^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/';
	let writeRule1 = subdomain ? '^(wp-(content|admin|includes).*) $1 [L]' : '^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]';
	let writeRule2 = subdomain ? '^(.*\.php)$ $1 [L]' : '^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]';

	let htaccess = `
		RewriteEngine On
		RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
		RewriteBase /
		RewriteRule ^index\.php$ - [L]

		# add a trailing slash to /wp-admin
		RewriteRule ${trailingSlash}

		RewriteCond %{REQUEST_FILENAME} -f [OR]
		RewriteCond %{REQUEST_FILENAME} -d
		RewriteRule ^ - [L]
		RewriteRule ${writeRule1}
		RewriteRule ${writeRule2}
		RewriteRule . index.php [L]
		`.replace(/\t/g, '').trim();

	let folder = 'development' === environment ? 'WordPress' : 'Tests-WordPress'

	await writeFile(path.join(workDirectoryPath, folder, '.htaccess'), htaccess);

}

module.exports = {
	isMultisite,
	convertToMultisite,
	generateHTAccess
};
