/**
 * External dependencies
 */
import fs from 'node:fs';
import path from 'node:path';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import dockerCompose from 'docker-compose';
import getHostUser from '@wordpress/env/lib/get-host-user.js';

/**
 * Internal dependencies
 */
import {runCLICmds, runCmd, changePermissions} from './utils.js';

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;

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
	// before we can conver to multisite all plugins must be deactivated.
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
	
	// convert to multisite.
	let command = 'wp core multisite-convert';

	if( subdomain ){
		command += ' --subdomains'
	}

	await runCLICmds(
		environment, 
		[command],
		config,
		spinner
	)

	// generate .htaccess
	await generateHTAccess( environment, config.workDirectoryPath, subdomain );

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
 * @param {string} 	environment Which environment to generate .htaccess for.
 * @param {boolean} subdomain  	True if converting to multisite subdomain.
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
	const { workDirectoryPath} = config;
	const {
		WP_PERMALINK
	} = config.env[ environment ].config


	// Convert to multisite if flag was passed.
	if( multisite ){
		spinner.text = 'Converting to multisite ' + ( subdomain ? 'subdomain' : 'subdirectory') + '...'
		
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
	);
}

/**
 * Generate posts/pages
 * 
 * @param {Object}      spinner     A CLI spinner which indicates progress.
 * @param {string}		directory		Path to directory containing files to be used for generation.
 * @param {string}		file		Files to be used for generation.
 * @param {string}		type		Type of content to generate.
 * @param {string}		environment	Which environment to generate content on.
 */
async function generatePosts({
	spinner,
	directory, 
	file, 
	type, 
	environment
}){
	const config = await loadConfig(path.resolve('.'));


	// if no directory/file passed use current directory.
	if ( ! directory && ! file ){
		directory = '.';
	}

	// if using directory
	if( directory ){
		// resolve type path.
		directory = path.resolve(directory);

		if ( ! fs.existsSync( directory ) ){
			spinner.fail( `${directory} could not be found.`)
		}
	}


	if( 'all' === environment ){
		await Promise.all([
			constructContent( 'development', config, directory, spinner ),
			constructContent( 'tests', config, directory, spinner ),
		])
	}else{
		await constructContent( environment, config, directory, spinner )
	}
	
}


async function constructContent ( environment, config, directory, spinner ) {
	const {name} = getHostUser();

	let src = 'tests' === environment ? 'tests-' : '';
	
	// we have to copy the directory to the container.
	await runCmd(
		'docker', 
		[
			'compose',
			'-f',
			config.dockerComposeConfigPath,
			'cp',
			`${directory}`,
			`${src}cli:/home/${name}/`
		]
	)

	// we have to rename the folder since docker cp is horrible and nests itself if the folder exists.
	await runCLICmds( 
		environment, 
		[
			`mv /home/${name}/${path.basename(directory)} /home/${name}/generation`
		], 
		config, 
		spinner 
	);

	// Change permissions to match the user
	await changePermissions(environment, config, `/home/${name}/generation/`, spinner)

	/** 
	 * @todo move to start command
	 */
	// move php scripts to cli containers
	await runCmd(
		'docker', 
		[
			'compose',
			'-f',
			config.dockerComposeConfigPath,
			'cp',
			path.join(process.cwd(), 'lib', 'php'),
			`${src}cli:/home/${name}/php/`
		]
	)

	// Change permissions to match the user
	await changePermissions(environment, config, `/home/${name}/php/`, spinner)

	/**
	 * end
	 */

	let scriptFile = `/home/${name}/php/constructContent.php`;

	let id = await runCLICmds(
		environment, 
		[`wp eval-file "${scriptFile}"`],
		config,
		spinner,
	)

	console.log( id );
}


export {
	configureWordPress,
	isMultisite,
	convertToMultisite,
	generateHTAccess,
	generatePosts
};
