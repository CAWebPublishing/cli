'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs-extra' );
const SimpleGit = require( 'simple-git' );
const { execSync } = require( 'child_process' );
const dockerCompose = require( 'docker-compose' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );

/**
 * Internal dependencies
 */

/**
 * Initialize config files
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.command   True if not generating CAWeb Configurations.
 */
module.exports = async function test({
	spinner
}) {

	try {
		const config = await loadConfig(path.resolve('.'));

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
