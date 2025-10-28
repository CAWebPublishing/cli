/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { CAWEB_OPTIONS } from'../options.js';
import { runCLICmds } from'../../helpers.js';

/**
 * Checks for the CAWeb Theme in the WordPress Environment.
 * 
 * @param {string}		environment   Which environment to activate the theme on.
 * @param {WPConfig} 	config	      The wp-env config object.
 * @param {Object}   	spinner A CLI spinner which indicates progress.
 */
async function isCAWeb({environment, cwd, is = 'active'}) {
	let answer = await runCLICmds({
		environment,
		cmds: [`wp theme is-${is} CAWeb && echo $?`],
		cwd
	})

	return '0' === answer;

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
async function configureCAWeb( {environment, cwd, configs} ) {

	const isThemeActive = await isCAWeb({environment, cwd});
	let cmds = [];

	// if our theme is active.
	if( false !== isThemeActive ){
		
		// iterate over possible CAWeb Options.
		for(const [k,v] of Object.entries(CAWEB_OPTIONS)){
			// get option value from wp-config.php if exists.
			if( configs[k] ){
				cmds.push(
					`wp option set '${v.name}' "${configs[k]}"`,
				)
			}
		}
	}
	
	// return CAWeb Theme Configuration commands.
	return cmds;
}

export {
	isCAWeb,
	configureCAWeb,
};
