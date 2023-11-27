'use strict';
/**
 * External dependencies
 */
const run = require('@wordpress/env/lib/commands/run');

/**
 * Internal dependencies
 */
const { runDockerCmds } = require('../../docker');
const path = require( 'path' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );

/**
 * Promisified dependencies
 */

/**
 * Updates all plugins for a given environment.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {string} options.environment   Which environment to updated.
 */
module.exports = async function updatePlugins({
	spinner,
	environment
}) {

	spinner.text = "Updating plugins...";
	const config = await loadConfig(path.resolve('.'));

	await runDockerCmds( environment, ['wp plugin update --all'], config );

	spinner.text = 'Completed updating plugins!'
	
};
