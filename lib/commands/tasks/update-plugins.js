'use strict';
/**
 * External dependencies
 */
const run = require('@wordpress/env/lib/commands/run');

/**
 * Internal dependencies
 */
const { runDockerCmds } = require('../../caweb');

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

	await run( {
		container: 'tests' === environment ? 'tests-cli' : 'cli',
		command: ['wp', 'plugin', 'update'],
		"--": ['--all'],
		envCwd: '.',
		spinner: spinner,
	})

	spinner.text = 'Completed updating plugins!'
	
};
