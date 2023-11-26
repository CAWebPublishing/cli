'use strict';
/**
 * External dependencies
 */


/**
 * Internal dependencies
 */
const { runDockerCmds } = require('./docker');
const { DIVI_OPTIONS, DIVI_BUILDER_OPTIONS, DIVI_UPDATE_OPTIONS } = require('./options');


/**
 * Checks if Divi Theme is active for the WordPress Environment.
 * 
 * @param {string} environment   Which environment to activate the theme on.
 * @param {WPConfig} config      The wp-env config object.
 */
async function isDiviThemeActive(
	environment,
	config
){

	return await runDockerCmds(
		environment,
		['wp theme is-active Divi'],
		config
	);

}

/**
 * Configures Divi for CAWebPublishing Service for the given environment by configure settings.
 * These steps are performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureDivi( environment, config, spinner ) {
	
	const activeTheme = await isDiviThemeActive( environment, config );

	// if Divi theme is active.
	if( false !== activeTheme ){
		let cmds = [];
		let diviOptions = await runDockerCmds(
			environment,
			[ 'wp option get et_divi --format=json' ], 
			config
		)
		let diviBuilderOptions = await runDockerCmds(
			environment,
			[ 'wp option get et_bfb_settings --format=json' ], 
			config
		)
		let diviUpdateOptions = await runDockerCmds(
			environment,
			[ 'wp option get et_automatic_updates_options --format=json' ], 
			config
		)

		// parse the options into a json object.
		diviOptions = diviOptions ? JSON.parse( diviOptions ) : {};
		diviBuilderOptions = diviBuilderOptions ? JSON.parse( diviBuilderOptions ) : {};
		diviUpdateOptions = undefined !== diviUpdateOptions && diviUpdateOptions ? JSON.parse( diviUpdateOptions ) : {};

		// iterate over config options.
		Object.entries(config.env[ environment ].config).forEach(([k,v]) => {
			// if the option is prefixed with ET_.
			if ( `${k}`.startsWith('ET_') ){
				
				// is a valid Divi Option.
				if( undefined !== DIVI_OPTIONS[k] ){
					diviOptions[DIVI_OPTIONS[k].name] = v;
				// is a valid Divi Builder Option.
				}else if( undefined !== DIVI_BUILDER_OPTIONS[k] ){
					diviBuilderOptions[DIVI_BUILDER_OPTIONS[k].name] = v;
				// is a valid Divi Update Option.
				}else if( undefined !== DIVI_UPDATE_OPTIONS[k] ){
					diviUpdateOptions[DIVI_UPDATE_OPTIONS[k].name] = v;
				}
			}
		});

		// parse option object back to string.
		diviOptions = JSON.stringify( diviOptions );
		diviBuilderOptions = JSON.stringify( diviBuilderOptions );
		diviUpdateOptions = JSON.stringify( diviUpdateOptions );

		cmds.push(`wp option update et_divi '${diviOptions}' --format=json`);
		cmds.push(`wp option update et_bfb_settings '${diviBuilderOptions}' --format=json`);
		cmds.push(`wp option update et_automatic_updates_options '${diviUpdateOptions}' --format=json`);
			

		if ( config.debug ) {
			spinner.info(
				`Running the following setup commands on the ${ environment } instance:\n - ${ setupCommands.join(
					'\n - '
				) }\n`
			);
		}
		
		// Execute theme option commands.
		await runDockerCmds(
			environment,
			cmds,
			config
		)
	}
		
	
}

module.exports = {
	configureDivi,
	isDiviThemeActive
};
