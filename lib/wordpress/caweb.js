/**
 * External dependencies
 */
import retry from '@wordpress/env/lib/retry.js';

/**
 * Internal dependencies
 */
import { CAWEB_OPTIONS } from'./options.js';
import { runCLICmds } from'../helpers.js';
import { isMultisite } from'./wordpress.js';
import { configureDivi } from'./divi.js';

/**
 * Activates the CAWeb Theme for the WordPress Environment if it's installed.
 * 
 * @param {string}		environment   Which environment to activate the theme on.
 * @param {WPConfig} 	config	      The wp-env config object.
 * @param {Object}   	spinner A CLI spinner which indicates progress.
 */
async function activateCAWeb(
	environment,
	config,
	spinner
){

	const isMulti = await isMultisite( environment, config , spinner);

	let cmds = ['wp theme is-installed CAWeb'];

	if( false !== isMulti ){
		cmds.push( 'wp theme enable CAWeb --network --activate' );
	}else{
		cmds.push( 'wp theme activate CAWeb' );
	}

	return await runCLICmds(
		environment,
		cmds,
		config,
		spinner
	);

}

/**
 * Configures CAWebPublishing Service for the given environment by configure settings,
 * and activating the CAWeb theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureCAWeb( environment, config, spinner ) {
	

	const isThemeActivated = await activateCAWeb( environment, config );

	const {
		DESIGN_SYSTEM_ENABLED
	} = config.env[ environment ].config

	// if our theme is active.
	if( false !== isThemeActivated ){
		spinner.text = `Configuring CAWebPublishing ${environment} Environment...`;

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
		await runCLICmds(
			environment,
			themeOptions,
			config,
			spinner
		);

		// Make Divi WordPress Configurations.
		await Promise.all( [
			retry( () => configureDivi( 'development', config, spinner ), {
				times: 2,
			} ),
			retry( () => configureDivi( 'tests', config, spinner ), {
				times: 2,
			} ),
		] );
	}
		
	// Activate Design System plugin
	if( undefined !== DESIGN_SYSTEM_ENABLED && DESIGN_SYSTEM_ENABLED ){
		await runCLICmds(
			environment,
			[
				'wp plugin is-installed design-system-wordpress', 
				'wp plugin activate design-system-wordpress'
			],
			config,
			spinner
		)
	}
	
	
}

export {
	activateCAWeb,
	configureCAWeb,
};
