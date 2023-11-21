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
 * @param {string} options.environment   Which environment to run docker command on.
 * @param {string[]} options.cmds   Array of commands to run.
 * 
 * @returns {Object}
 */
async function runDockerCmds({
	environment,
	cmds
}) {

	try {
		const config = await loadConfig(path.resolve('.'));

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
			(output) => {
				// Remove the Container information and new lines.
				output.err = output.err.replace(/\s*Container .*Running\n|\n/g, '')
				output.out = output.out.replace(/\s*Container .*Running\n|\n/g, '')
				return output;
			},
			(output) => {
				// Remove the Container information and new lines.
				output.err = output.err.replace(/\s*Container .*Running\n|\n/g, '')

				return false;
			}
		);

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};

/**
 * Checks whether WordPress environment is a multisite installation.
 * 
 * @param {string} options.environment   Which environment to check for multisite installation.
 * @returns 
 */
async function isMultisite({ environment }){
	let isMulti = await runDockerCmds({
		environment,
		cmds: [
			'wp config get MULTISITE'
		]
	})

	return undefined !== isMulti.out ? isMulti.out : isMulti;
}

/**
 * Activates the CAWeb Theme for the WordPress Environment if it's installed.
 * 
 * @param {Object}  options
 * @param {string} options.environment   Which environment to activate the theme on.
 */
async function activateCAWeb({
	environment
}){

	const isMulti = await isMultisite({environment});

	let cmds = ['wp theme is-installed CAWeb'];

	if( isMulti ){
		cmds.push( 'wp theme enable CAWeb --network --activate' );
	}else{
		cmds.push( 'wp theme activate CAWeb' );
	}

	return await runDockerCmds( {
		environment,
		cmds
	});

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
	

	const isThemeActivated = await activateCAWeb( { environment })

	// if our theme is active.
	if( isThemeActivated ){
		let themeOptions = [];

		// iterate over config options.
		Object.entries(config.env[ environment ].config).forEach(([k,v]) => {
			// if the option is prefixed with CAWEB_ and is a valid CAWeb Option.
			if ( `${k}`.startsWith('CAWEB_') && undefined !== CAWEB_OPTIONS[k] ){
				const option = CAWEB_OPTIONS[k];
				// set the option.
				themeOptions.push(
					`wp option set '${option.name}' "${v}"`
				);
			}
		})

		if ( config.debug ) {
			spinner.info(
				`Running the following setup commands on the ${ environment } instance:\n - ${ setupCommands.join(
					'\n - '
				) }\n`
			);
		}
		
		// Execute theme option commands.
		await runDockerCmds({
			environment,
			cmds: themeOptions
		})
	}
		
	
}

module.exports = {
	activateCAWeb,
	configureCAWeb,
	runDockerCmds
};
