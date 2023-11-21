'use strict';
const fs = require( 'fs-extra' );

/**
 * Internal dependencies
 */
const {
	runDockerCmd,
} = require('../../caweb');


/**
 * Promisified dependencies
 */

/**
 * Test code.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to test in.
 */
module.exports = async function updatePlugins({
	spinner,
	environment
}) {

	try {
		spinner.text = "Updating plugins...";

		let result = await runDockerCmd( {
			spinner,
			environment,
			cmds: [`wp plugin update --all`]
		})

		spinner.prefixText = `${result.out}`;

		spinner.text = 'Completed updating plugins!'

	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
