'use strict';
/**
 * External dependencies
 */
const run = require( '@wordpress/env/lib/commands/run' );

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

	await run({
		container: 'tests' === environment ? 'tests-cli' : 'cli',
		command: ['bash'],
		"": "",
		envCwd: '.',
		spinner,
		debug
	});

};
