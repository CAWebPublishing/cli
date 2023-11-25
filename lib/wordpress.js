'use strict';
/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
const {runDockerCmds} = require('./docker');

/**
 * Checks whether WordPress environment is a multisite installation.
 * 
 * @param {string}		environment	Which environment to check for multisite installation.
 * @param {WPConfig}    config      The wp-env config object.
 * @returns 
 */
async function isMultisite( environment, config ){
	let isMulti = await runDockerCmds(
		environment,
		[ 'wp config get MULTISITE' ],
		config
	)

	return undefined !== isMulti.out ? isMulti.out : isMulti;
}


module.exports = {
	isMultisite,
};
