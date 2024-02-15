/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import {runCmd, projectPath} from '../../lib/index.js';
import updateBlock from './update-block.js';

const localFile = path.join(projectPath, 'package.json');
const pkg = JSON.parse( fs.readFileSync(localFile) );

/**
 * Get NPM Package Latest Version
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
		// if block directory already exists.	
		if( fs.existsSync(path.resolve(process.cwd(), slug)) ){
			spinner.info(`${slug} already exists.`)

			const { yesUpdate } = await inquirer.prompt( [
				{
					type: 'confirm',
					name: 'yesUpdate',
					message: 'Would you like to update it?',
					default: false,
				},
			] );

			if( yesUpdate ){
				spinner.text = `Updating ${slug}...`;
				await updateBlock({spinner, debug, slug});
			}
		// create a new block
		}else{
			// Get cagov component version if it exists.
			let version = await getNPMPackageVersion(`@cagov/${slug}`, spinner);

			// call the wordpress create-block command using our template.
			await runCmd(
				'npx',
				[
					`@wordpress/create-block`,
					slug,
					'--template=' + path.join(projectPath, 'template', 'index.cjs')
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
						cwd: path.join(process.cwd(), slug ),
						stdio: 'inherit'
					}
				)
				
				spinner.text = spinnerText;

			}
		}
		
		
};
