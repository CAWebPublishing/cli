'use strict';
/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
const shell = require('./shell')
const start = require('./start')
const test = require( './test' );

const tasks = require('./tasks');

module.exports = {
	shell,
	start,
	test,
	...tasks
};
