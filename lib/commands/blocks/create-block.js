/**
 * External dependencies
 */
import path from 'node:path';
import fs from 'fs-extra';
import { spawn } from 'node:child_process';

/**
 * Internal dependencies
 */
import {runCmd} from '../../utils.js';

const localPath = path.resolve( path.join(process.cwd(), 'node_modules/@caweb/cli/package.json') )
const pkg = JSON.parse( await fs.readFile(localPath) );

/**
 * Get Block Component Latest Package Version
 * @param {string}  options.slug   Block slug.
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 */
async function getNPMPackageVersion(pkg, spinner){
	return await runCmd(
		'npm',
		[
			'view',
			`${pkg}`,
			'version'
		],
		spinner
	)
	
}

/**
 * Create Block
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {string} options.slug   Block slug.
 */
export default async function createBlock({
	spinner,
	debug,
	slug
} ) {
	
		// Get cagov component version if it exists.
		let version = await getNPMPackageVersion(`@cagov/${slug}`, spinner);

		// call the wordpress create-block command using our template.
		await runCmd(
			'npx',
			[
				`@wordpress/create-block`,
				slug,
				'--template=' + path.resolve( path.join(process.cwd(), 'node_modules/@caweb/cli/lib/template/index.cjs') )
			],
			spinner,
			{
				stdio: 'inherit'
			}
		)

		// install cagov npm package if it exists.
		if( version ){
			// capture spinner.text result
			let spinnerText = spinner.text;
			spinner.text = '';

			await runCmd(
				'npm',
				[
					'install',
					`@cagov/${slug}@${version}`,
				],
				spinner,
				{
					cwd: path.resolve( path.join(process.cwd(), slug ) ),
					stdio: 'inherit'
				}
			)
			
			spinner.text = spinnerText;

		}
		
};
