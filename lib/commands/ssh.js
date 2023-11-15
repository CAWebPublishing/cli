'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs-extra' );
const SimpleGit = require( 'simple-git' );
const { exec, execSync } = require( 'child_process' );
const dockerCompose = require( 'docker-compose' );
const loadConfig = require( '@wordpress/env/lib/config/load-config' );

/**
 * Internal dependencies
 */

/**
 * Initialize config files
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.environment   Which environment to ssh into.
 */
module.exports = async function ssh({
	spinner,
	environment
}) {

	try {
		const config = await loadConfig(path.resolve('.'));
		const { workDirectoryPath } = config;
		const dirHash = path.basename(workDirectoryPath);

		let name = `${dirHash}-` + ('tests' === environment ? `${environment}-` : '') + 'wordpress-1';
		const containers = await dockerCompose.ps({
			cwd: workDirectoryPath,
			commandOptions: [
				["--format", 'json']
			]
		}).then(
			(res) => {
				return JSON.parse(res.out);
			}
		);
				
		let containerID = containers.filter((service) => {
			return name === service.Name;
		}).pop().ID

		let msg = `CAWebPublishing Local Environment`;
		let cmd = [
			'docker',
			'exec',
			'-it',
			`${containerID}`,
			'/bin/bash'
		]
		
		execSync('start cmd.exe /K ' + cmd.join(' '), {
			detached: true, 
			stdio: 'ignore' 
		});
		

	} catch(error) {
		console.log(error);
		
		process.exit( 1 );
	}
	
};
