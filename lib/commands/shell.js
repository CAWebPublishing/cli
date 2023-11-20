'use strict';
/**
 * External dependencies
 */
const wpEnvRun = require( '@wordpress/env/lib/commands/run' );

/**
 * Internal dependencies
 */

/**
 * Opens shell terminal in WordPress environment
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to open terminal in.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function shell({
	spinner,
	environment,
	debug
}) {

	const container = 'tests' === environment ? 'tests-cli' : 'cli';

	await wpEnvRun({
		container: container,
		command: ['bash'],
		"": "",
		envCwd: '.',
		spinner,
		debug
	});

};
