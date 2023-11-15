'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs-extra' );
const SimpleGit = require( 'simple-git' );
const { execSync } = require( 'child_process' );

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

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
