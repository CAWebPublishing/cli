/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import dns from 'dns';

/**
 * Internal dependencies
 */
import {appPath, runCLICmds} from '../helpers.js';

/**
 * Network activate all active plugins.
 * 
 * @param {string} 		environment Which environment to convert into a multisite installation.
 * @param {WPConfig} 	config 		The wp-env config object.
 * @param {boolean} 	subdomain   True if converting to multisite subdomain.
 * @param {Object} 		spinner     A CLI spinner which indicates progress.
 * @returns 
 */
async function networkActivatePlugins( {environment, cwd} ){

	// first lets get all active plugins
	let activePlugins = await runCLICmds({
		environment,
		cmds: ['wp option get active_plugins --format=json'],
		cwd
	})

	activePlugins = Object.values(JSON.parse( activePlugins ));

	// network activate all active plugins again.
	if( activePlugins.length ){
		await runCLICmds({
			environment,
			cmds: ['wp plugin activate ' + activePlugins.join(' ') + ' --network'],
			cwd
		})
	}

}

/**
 * Configures the application password for the given environment.
 * 
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureApplicationPassword( {environment, cwd, configs} ){
	let cawebJson = fs.existsSync( path.join(appPath, 'caweb.json') ) ? 
		JSON.parse(fs.readFileSync(path.join(appPath, 'caweb.json'))) 
		: {};

	// Check if the caweb.json file has a sync property.
	if( !cawebJson.sync ){
		cawebJson.sync = {};
	}

	// Check if application password exists.
	const exists = await runCLICmds({
		environment,
		cmds: [ 'wp user application-password exists 1 caweb && echo $?' ],
		cwd
	})
	
	if( '0' === exists ){
		const uuid = await runCLICmds({
			environment,
			cmds: [ 'wp user application-password list 1 --field=uuid --name=caweb --porcelain' ],
			cwd
		});

		// delete the existing application password.
		await runCLICmds({
			environment,
			cmds: [ `wp user application-password delete 1 ${uuid}` ],
			cwd
		})
	}

	let pwd = await runCLICmds({
			environment,
			cmds: [ 'wp user application-password create 1 caweb --porcelain' ],
			cwd
	});
	
	// set the local sync information.	
	cawebJson['sync']['local'] = {
		'url': configs.WP_SITEURL,
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
async function configureWordPress({environment, cwd, multisite, subdomain, configs}){
	
	// Create an Application Password for the user.
	await configureApplicationPassword( { environment, cwd, configs } );

	if( multisite ){
		await networkActivatePlugins( {environment, cwd} );
	}

	return [
		`wp option update permalink_structure "${configs.WP_PERMALINK}"`,
		`wp rewrite structure ${configs.WP_PERMALINK} --hard`
	];

}

export {
	configureWordPress
};
