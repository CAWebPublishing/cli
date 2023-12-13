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
const getHostUser = require( '@wordpress/env/lib/get-host-user' );

/**
 * Internal dependencies
 */
const {
	runDockerCmds, 
} = require('../docker');

const { 
	buildWPEnvConfig, 
	buildDockerComposeConfig 
} = require('../configs');

const pkg = require( '../../package.json' );
const { DIVI_OPTIONS } = require('../options');

const { 
	isDiviThemeActive, 
	configureDivi 
} = require('../divi');

const {
	activateCAWeb,
	configureCAWeb
} = require('../caweb');

const {
	generateHTAccess
} = require( '../wordpress' );

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
	debug,
	multisite,
	subdomain
}) {

	try {
		const config = await loadConfig(path.resolve('.'));
		const {WP_PERMALINK} = config.env[ environment ].config
		const { workDirectoryPath} = config;
		const {name} = getHostUser();

		spinner.text = "Testing code...";
		
		/*
		await runDockerCmds(
			environment,
			[
				`wp rewrite structure ${WP_PERMALINK} --hard`,
				'wp rewrite flush'
			],
			config
		);
*/
		/*
		let result = await runDockerCmds(
			environment,
			['wp theme is-installed CAWeb'],
			config
		)

		if( '' !== result.out ) {
			console.log( JSON.parse(result.out))
		}else{
			console.log(result);
		}
		*/

		spinner.text = 'Completed Testing code...'

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
