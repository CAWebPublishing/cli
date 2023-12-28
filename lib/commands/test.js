/**
 * External dependencies
 */

/**
 * Internal dependencies
 */

/**
 * Promisified dependencies
 */

/**
 * Test code.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to test in.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function test({
	spinner,
	debug,
	environment
} ) {

	try {
		spinner.text = "Testing Code Functionality";
		
		spinner.text = "Done!";
	} catch(error) {
		console.log(error)

		process.exit( 1 );
	}
	
};
