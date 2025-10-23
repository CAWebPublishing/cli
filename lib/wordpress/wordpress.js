/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import got from 'got';
import dns from 'dns/promises';

/**
 * Internal dependencies
 */
import {appPath, runCLICmds} from '../helpers.js';

/**
 * Checks whether WordPress environment is a multisite installation.
 * 
 * @param {string}		environment	Which environment to check for multisite installation.
 * @param {WPConfig}    config      The wp-env config object.
 * @param {Object} 		spinner     A CLI spinner which indicates progress.
 * @returns 
 */
async function isMultisite( environment, config, spinner ){

	const result = await runCLICmds(
		environment,
		[ 'wp config get MULTISITE' ],
		config,
		spinner
	)

	/**
	 * If the constant doesn't exist the wp cli returns an exit code of 1
	 * we have to return false, otherwise we can just return the cli result.
	 */
	return typeof result === 'object' && result.exitCode ? false : result;
}

/**
 * Transforms an existing single-site installation into a multisite installation.
 * 
 * @param {string} 		environment Which environment to convert into a multisite installation.
 * @param {WPConfig} 	config 		The wp-env config object.
 * @param {boolean} 	subdomain   True if converting to multisite subdomain.
 * @param {Object} 		spinner     A CLI spinner which indicates progress.
 * @returns 
 */
async function convertToMultisite( environment, config, subdomain, spinner ){
	
	// before we can convert to multisite all plugins must be deactivated.
	// first lets get all plugins
	let activePlugins = await runCLICmds(
		environment,
		['wp option get active_plugins --format=json'],
		config,
		spinner
	)

	activePlugins = Object.values(JSON.parse( activePlugins ));

	// deactivate all active plugins.
	if( activePlugins.length ){
		await runCLICmds(
			environment,
			['wp plugin deactivate ' + activePlugins.join(' ')],
			config,
			spinner
		)
	}
	
	await runCLICmds(
		environment, 
		[
			// convert to multisite.
			'wp core multisite-convert' + ( subdomain ? ' --subdomains' : '' ),
		],
		config,
		spinner
	)

	// network activate all active plugins again.
	if( activePlugins.length ){
		await runCLICmds(
			environment,
			['wp plugin activate ' + activePlugins.join(' ') + ' --network'],
			config,
			spinner
		)
	}

}

/**
 * Generates .htaccess file content.
 * 
 * @param {string}  environment Which environment to generate .htaccess for.
 * @param {boolean} multisite   True if converting to multisite.
 * @param {boolean} subdomain  	True if converting to multisite subdomain.
 */
async function generateHTAccess(environment, workDirectoryPath, multisite, subdomain){
	let folder = 'development' === environment ? 'WordPress' : 'Tests-WordPress';

	// if .htaccess already exists, no need to generate.
	if( fs.existsSync(path.join(workDirectoryPath, folder, '.htaccess')) ){
		return; // .htaccess already exists, no need to generate.
	}

	// default htaccess for single site.
	let htaccess = `
		<IfModule mod_rewrite.c>
		RewriteEngine On
		RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
		RewriteBase /
		RewriteRule ^index\.php$ - [L]
		RewriteCond %{REQUEST_FILENAME} !-f
		RewriteCond %{REQUEST_FILENAME} !-d
		RewriteRule . /index.php [L]
		</IfModule>
		`;


	// if multisite, we need to add the multisite rules.
	if( multisite ){
		let trailingSlash = subdomain ? '^wp-admin$ wp-admin/ [R=301,L]' : '^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/';
		let writeRule1 = subdomain ? '^(wp-(content|admin|includes).*) $1 [L]' : '^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]';
		let writeRule2 = subdomain ? '^(.*\.php)$ $1 [L]' : '^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]';

		htaccess = `
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
		`;
	}
	
	// write the .htaccess file.
	fs.writeFileSync(path.join(workDirectoryPath, folder, '.htaccess'), htaccess.replace(/\t/g, '').trim());

}

/**
 * Configures the application password for the given environment.
 * 
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureApplicationPassword( environment, config, spinner ){
	let cawebJson = fs.existsSync( path.join(appPath, 'caweb.json') ) ? 
		JSON.parse(fs.readFileSync(path.join(appPath, 'caweb.json'))) 
		: {};

	// Check if the caweb.json file has a sync property.
	if( !cawebJson.sync ){
		cawebJson.sync = {};
	}

	// Check if application password exists.
	const exists = await runCLICmds(
		environment,
		[ 'wp user application-password exists 1 caweb' ],
		config, spinner
	)
	
	if( exists ){
		const uuid = await runCLICmds(
			environment,
			[ 'wp user application-password list 1 --field=uuid --name=caweb --porcelain' ],
			config, spinner
		);

		// delete the existing application password.
		await runCLICmds(
			environment,
			[ `wp user application-password delete 1 ${uuid}` ],
			config, spinner
		)
	}

	let pwd = await runCLICmds(
			environment,
			[ 'wp user application-password create 1 caweb --porcelain' ],
			config, spinner
		)
	
	cawebJson['sync']['local'] = {
		'url': config.env.development.config?.WP_SITEURL || 'http://localhost:8888',
		'user': 'admin',
		pwd,
	}

	// update the caweb.json file with the new sync information.
	fs.writeFileSync(
		path.join(appPath, 'caweb.json'),
		JSON.stringify(cawebJson, null, 4)
	);
}


/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 * @param {boolean}   	  multisite   True if converting to multisite.
 * @param {boolean} 	  subdomain   True if converting to multisite subdomain.
 */
async function configureWordPress(environment, config, spinner, multisite, subdomain){
	const {
		WP_PERMALINK
	} = config.env[ environment ].config

	// Create an Application Password for the user.
	await configureApplicationPassword( environment, config, spinner );

	// Convert to multisite if flag was passed.
	if( multisite ){
		await convertToMultisite( environment, config, subdomain, spinner )
	}
	
	// rewrite and flush permalink structure.
	await runCLICmds(
		environment, 
		[
			`wp rewrite structure ${WP_PERMALINK} --hard`
		],
		config,
		spinner
	)

	// generate .htaccess
	await generateHTAccess( environment, config.workDirectoryPath, multisite, subdomain );
	
}

/**
 * Basically a quick check to see if we can connect to the internet.
 *
 * @return {boolean} True if we can connect to WordPress.org, false otherwise.
 */
let IS_OFFLINE;
async function canAccessWPORG() {
	// Avoid situations where some parts of the code think we're offline and others don't.
	if ( IS_OFFLINE !== undefined ) {
		return IS_OFFLINE;
	}
	IS_OFFLINE = !! ( await dns.resolve( 'WordPress.org' ).catch( () => {} ) );
	return IS_OFFLINE;
}

/**
 * Returns the latest stable version of WordPress by requesting the stable-check
 * endpoint on WordPress.org.
 *
 * @param {Object} options an object with cacheDirectoryPath set to the path to the cache directory in ~/.wp-env.
 * @return {string} The latest stable version of WordPress, like "6.0.1"
 */
let CACHED_WP_VERSION;
async function getLatestWordPressVersion( options ) {
	// Avoid extra network requests.
	if ( CACHED_WP_VERSION ) {
		return CACHED_WP_VERSION;
	}

	const cacheOptions = {
		workDirectoryPath: options.cacheDirectoryPath,
	};

	// When we can't connect to the internet, we don't want to break wp-env or
	// wait for the stable-check result to timeout.
	if ( ! ( await canAccessWPORG() ) ) {
		const latestVersion = await getCache(
			'latestWordPressVersion',
			cacheOptions
		);
		if ( ! latestVersion ) {
			throw new Error(
				'Could not find the current WordPress version in the cache and the network is not available.'
			);
		}
		return latestVersion;
	}

	const versions = await got(
		'https://api.wordpress.org/core/stable-check/1.0/'
	).json();

	for ( const [ version, status ] of Object.entries( versions ) ) {
		if ( status === 'latest' ) {
			CACHED_WP_VERSION = version;
			await setCache( 'latestWordPressVersion', version, cacheOptions );
			return version;
		}
	}
}

export {
	configureWordPress,
	configureApplicationPassword,
	isMultisite,
	convertToMultisite,
	generateHTAccess,
	canAccessWPORG,
	getLatestWordPressVersion
};
