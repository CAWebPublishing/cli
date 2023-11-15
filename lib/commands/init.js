'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs-extra' );

/**
 * Internal dependencies
 */
const {
	theme_dir,
	buildWPEnvConfig,
} = require('../configs');

const {downloadSources, initGitSubmodules} = require('../download-sources');

const { init: initPhpMyAdmin  } = require('../phpmyadmin');

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;


/**
 * Initialize config files
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.excludeInit   True if not generating CAWeb Configurations.
 * @param {boolean} options.excludePlugins   True if excluding CAWeb plugins.
 * @param {boolean} options.excludeTheme   True if excluding CAWeb Theme.
 * @param {boolean} options.excludePhpmyadmin   True if excluding phpMyAdmin Docker Service.
 */
module.exports = async function init({
	spinner,
	excludeInit,
	excludePlugins,
	excludeTheme,
	excludePhpmyadmin
}) {

	let wpEnvConfig = buildWPEnvConfig();

	// enable CAWeb Theme as default theme.
	if( ! excludeTheme ){
		wpEnvConfig.themes = [`${theme_dir}/CAWeb`];
	}

	// Write .wp-env.json file.
	if( ! excludeInit ){
		await writeFile(
			path.join(process.cwd(), '.wp-env.json'),
			JSON.stringify( wpEnvConfig, null, 4 )
		);
	}
	// Write docker-compose.override.yml file.
	if( ! excludePhpmyadmin ){
		await initPhpMyAdmin({spinner});
	}

	// download resources.
	await downloadSources({
		excludePlugins,
		excludeTheme
	}, spinner);
			
	
	spinner.text = 'Done.';
};
