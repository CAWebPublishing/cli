/**
 * External dependencies
 */
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import cp from 'child_process';

//var WP = require('wp-cli');
/**
 * Internal dependencies
 */
import { runCLICmds, runCmd, projectPath } from '../lib/index.js';
/*
import generateOverridesMD from '../admin.js';
import { CAWEB_OPTIONS, DIVI_OPTIONS } from '../options.js';
*/
/**
 * Promisified dependencies
 */
import os from 'os';

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
	
	spinner.text = "Testing Code Functionality";
		const config = await loadConfig(path.resolve('.'));
		
		process.env.WP_CLI_CONFIG_PATH  = path.join(config.workDirectoryPath, 'config.yml');
	 // update post meta.
	 let id = 35;
	 let newId = 30
	 let tbl = `wp_term_taxonomy`;

		let result = await runCmd(
                    'php',
                    [
                        path.join(projectPath, 'bin', 'wp-cli.phar'),
						'--ssh=docker:' + path.basename(config.workDirectoryPath) + '-cli-1',
                        `db query 'UPDATE ${tbl} SET term_taxonomy_id=${newId},term_id=${newId} WHERE term_id=${id}'`,
                    ]
                )

				console.log( result );
		/*
		let q = `UPDATE wp_posts SET id=1 WHERE id=10 `;
		let u = 'http://danny.com/wp-json/wp/v2/pages/2827';
		let result = await axios.request({
			url: u,
			method: 'POST',
			data: {
				title: 'Audio',
				meta: {
					_et_pb_use_builder: 'on'
				}
			},
			headers: {
				Authorization: 'Basic ' + Buffer.from(`admin:9RUG nPuo u581 cY2A uSJd FE2P`).toString('base64')
			}
		})
		.then( async (res) => { return res.data; } )
		.catch( async (err) => { return err; } )

		*/
		/*
		let result = await runCmd(
			'php', 
			[
				//'-r',
				path.join(projectPath, 'bin', 'wp-cli.phar'),
				'--ssh=' + `docker:${path.basename(config.workDirectoryPath)}-cli-1`,
				//'@dev',
				//`db query '${q}'`,
				'post list',
				//'--info',
				'--skip-themes',
				//`--url=${new URL(u).origin}`
				// '--format=json'
				//'--skip-column-names',
				//'post list path=/nas/content/live/cawebdev/ --http=https://dev.sites.ca.gov --url=https://dev.sites.ca.gov',
			], 
			config
		)*/
		
		//console.log( 'Result', result.toString() );
		//console.log( 'Output', result.stdout.toString() );
		//console.log( 'Error', result.stderr.toString() );
};
