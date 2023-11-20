'use strict';
/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const path = require( 'path' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );


/**
 * Internal dependencies
 */
const { CAWEB_OPTIONS } = require('./options');

/**
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to open terminal in.
 * @param {Array} options.cmds   Array of commands to run.
 * 
 * @returns {Object}
 */
async function runDockerCmd({
	spinner,
	environment,
	cmds
}) {

	try {
		const config = await loadConfig(path.resolve('.'));

		// -eo pipefail exits the command as soon as anything fails in bash.
		//const setupCommands = [ 'set -eo pipefail' ];

		// Execute all setup commands in a batch.
		return await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			[ 'bash', '-c', cmds.join( ' && ' ) ],
			{
				cwd: config.workDirectoryPath,
				commandOptions: [ '--rm' ],
				log: config.debug,
			}
		).then(
			(result) => {
				if( '' !== result.out ){
					console.log( result.out )
				}else{
					console.log(result.err)
				}
				return result;
			},
			(err) => {
				return false;
			}
		)

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};

/**
 * Activates the CAWeb Theme for the WordPress Environment if it's installed.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to activate the theme on.
 */
async function activateCAWeb({
	spinner,
	environment
}){
	return await runDockerCmd( {
		spinner,
		environment,
		cmds: ['wp theme is-installed CAWeb && wp theme activate CAWeb']
	}).then(
		(result) => {
			return true;
		},
		(err) => {
			return false;
		}
	)

}

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureCAWeb( environment, config, spinner ) {
	

	const isThemeActivated = await activateCAWeb( {
		spinner,
		environment
	})

	// if our theme is active.
	if( isThemeActivated ){
		let themeOptions = [];

		// iterate over config options.
		Object.entries(config.env[ environment ].config).forEach(([k,v]) => {
			// if the option is prefixed with CAWEB_ and is a valid CAWeb Option.
			if ( `${k}`.startsWith('CAWEB_') && undefined !== CAWEB_OPTIONS[k] ){
				// set the option.
				themeOptions.push(
					`wp option set '${CAWEB_OPTIONS[k]}' "${v}"`
				);
			}
		})


		await runDockerCmd({
			spinner,
			environment,
			cmds: themeOptions
		})
	}
		
	
}

module.exports = {
	activateCAWeb,
	configureCAWeb,
	runDockerCmd
};
