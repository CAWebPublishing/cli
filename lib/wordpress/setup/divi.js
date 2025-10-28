/**
 * Internal dependencies
 */
import { runCLICmds } from '../../helpers.js';
import { DIVI_OPTIONS } from '../options.js';


/**
 * Checks for the Divi Theme in the WordPress Environment.
 * 
 * @param {string}		environment   Which environment to activate the theme on.
 * @param {WPConfig} 	config	      The wp-env config object.
 * @param {Object}   	spinner A CLI spinner which indicates progress.
 */
async function isDivi({environment, cwd, is = 'active'}) {
	let answer = await runCLICmds({
		environment,
		cmds: [`wp theme is-${is} Divi && echo $?`],
		cwd
	})

	return '0' === answer;

}

/**
 * Configures Divi for CAWebPublishing Service for the given environment by configure settings.
 * These steps are performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureDivi( {environment, cwd, configs} ) {
	
	const isThemeInstalled = await isDivi( {environment, cwd, is: 'installed'} );
	let cmds = [];

	// if CAWeb theme is active.
	if( false !== isThemeInstalled ){
		let diviOptions = await runCLICmds({
			environment,
			cmds: [ 'wp option get et_divi --format=json' ], 
			cwd
		});

		let diviBuilderOptions = await runCLICmds({
			environment,
			cmds: [ 'wp option get et_bfb_settings --format=json' ], 
			cwd
		});

		let diviUpdateOptions = await runCLICmds({
			environment,
			cmds: [ 'wp option get et_automatic_updates_options --format=json' ], 
			cwd
		})

		// parse the options into a json object.
		diviOptions = typeof result === 'object' && ! diviOptions.exitCode ? JSON.parse( diviOptions ) : {};
		diviBuilderOptions = typeof result === 'object' && ! diviBuilderOptions.exitCode ? JSON.parse( diviBuilderOptions ) : {};
		diviUpdateOptions = typeof result === 'object' && ! diviUpdateOptions.exitCode ? JSON.parse( diviUpdateOptions ) : {};

		// iterate over mapped Divi option groups.
		Object.entries(DIVI_OPTIONS).forEach(([group, options]) => {
			// iterate over each group options.
			Object.entries(options).forEach(([key, data]) => {

				// if user config has a Divi option variable use that, otherwise use our default.
				let option_value = configs[key] || null;
				
				if( null !== option_value ){
					// is a valid Divi Option.
					if( 'et_divi' === group ){
						diviOptions[data.name] = option_value;
					// is a valid Divi Builder Option.
					}else if( 'et_bfb_settings' === group ){
						diviBuilderOptions[data.name] = option_value;
					// is a valid Divi Update Option.
					}else if( 'et_automatic_updates_options' === group ){
						diviUpdateOptions[data.name] = option_value;
					}
				}
			})
		})

		// parse option object back to string.
		diviOptions = JSON.stringify( diviOptions );
		diviBuilderOptions = JSON.stringify( diviBuilderOptions );
		diviUpdateOptions = JSON.stringify( diviUpdateOptions );

		// update each option.
		cmds.push(
			`wp option update et_divi '${diviOptions}' --format=json`,
			`wp option update et_bfb_settings '${diviBuilderOptions}' --format=json`,
			`wp option update et_automatic_updates_options '${diviUpdateOptions}' --format=json`
		);

		return cmds;
	}
		
	
}

export {
	isDivi,
	configureDivi
};
