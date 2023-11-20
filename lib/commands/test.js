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
const {
	runDockerCmd,
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
 */
module.exports = async function test({
	spinner,
	environment
}) {

	try {
		const config = await loadConfig(path.resolve('.'));
		/*
		let themeOptions = [];

		Object.entries(config.env[ 'development' ].config).forEach(([k,v]) => {
			// if the option is prefixed with CAWEB_ and is a valid CAWeb Option.
			if ( `${k}`.startsWith('CAWEB_') && undefined !== CAWEB_OPTIONS[k] ){
				console.log(CAWEB_OPTIONS[k])
				// set the option.
				themeOptions.push(
					`wp option set '${CAWEB_OPTIONS[k]}' "${v}"`
				);
			}
		})

		console.log(themeOptions);


		// Write CAWeb .wp-env.json file.
		await writeFile(
			path.join(process.cwd(), '.wp-env.json'),
			JSON.stringify( buildWPEnvConfig({bare: false}), null, 4 )
		);

		let result = await runDockerCmd( {
			spinner,
			environment,
			cmds: [`wp option set 'ca_site_version' "5.5"`]
		})
		
		
		Object.entries(result).forEach((k,v) => {
			//console.log(`${k}:${v}`)
		})

		//console.log(`Result: ${result}`)
		*/

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
