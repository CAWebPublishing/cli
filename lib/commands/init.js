'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs-extra' );

/**
 * Internal dependencies
 */
const {
	theme_dir,
	buildWPEnvConfig,
} = require('../configs');

const {downloadSources, initGitSubmodules} = require('../download-sources');

const { init: initPhpMyAdmin  } = require('../phpmyadmin');

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;


/**
 * Initialize config files
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 */
module.exports = async function init({
	spinner,
}) {

	

	

	

	
	
};
