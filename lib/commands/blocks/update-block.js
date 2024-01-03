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
import createBlock from './create-block.js';

const localPath = path.resolve( path.join(process.cwd(), 'node_modules/@caweb/cli/package.json') )
const pkg = JSON.parse( await fs.readFile(localPath) );


/**
 * Create Block
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {string} options.slug   Block slug.
 */
export default async function updateBlock({
	spinner,
	debug,
	slug
} ) {
	
		// if block directory exists.	
		if( fs.existsSync(path.resolve(process.cwd(), slug)) ){
			spinner.text = `Updating ${slug} block plugin.`;

			// make tmp directory
			fs.ensureDir( `${slug}.tmp`);

			// move inc directory to tmp directory
			fs.copySync(`${slug}/inc/`, `${slug}.tmp/inc/`);
			
			// move src directory to tmp directory
			fs.copySync(`${slug}/src/`, `${slug}.tmp/src/`);

			// delete old block.
			fs.removeSync( `${slug}` );

			// Recreate the block.
			await createBlock({spinner, debug, slug});

			// move inc directory back to block directory
			fs.copySync(`${slug}.tmp/inc/`, `${slug}/inc/` );
			
			// move src directory back to block directory
			fs.copySync(`${slug}.tmp/src/`, `${slug}/src/`);

			// delete tmp directory.
			fs.removeSync( `${slug}.tmp` );

			spinner.succeed(`${slug} has been updated!`); 

		}else{
			spinner.fail(`${slug} plugin directory not found.`)
		}			
		
};
