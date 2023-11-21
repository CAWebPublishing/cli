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
const run = require('@wordpress/env/lib/commands/run');

/**
 * Internal dependencies
 */
const {
	runDockerCmds, 
	activateCAWeb, 
} = require('../caweb');

const { buildWPEnvConfig, buildDockerComposeConfig } = require('../configs');

const pkg = require( '../../package.json' );
const { CAWEB_OPTIONS } = require('../options');


/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;

/**
 * Test code.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to test in.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function test({
	spinner,
	environment,
	debug
}) {

	try {
		const config = await loadConfig(path.resolve('.'));
		
		spinner.text = "Testing code...";

		/*
		let cmds = [
			'wp theme is-installed CAWeb',
		];


		let result = await runDockerCmds( {
			'tests' === environment ? 'tests-cli' : 'cli',
			cmds
		}
	
		console.log(result);

		*/

		spinner.text = 'Completed Testing code...'

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
