/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs-extra';

/**
 * Internal dependencies
 */
import {runCmd} from '../../lib/index.js';
import createBlock from './create-block.js';

/**
 * Returns the WordPress Plugin Header.
 * 
 * @param {String} content Content to search for plugin header.
 * @returns String
 */
function getPluginHeader( content ){
	return content.substring(
		content.indexOf('<?php') + '<?php'.length,
		content.indexOf('*/') + '*/'.length
	)
}

/**
 * Update Block
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
			console.log( `Updating ${slug} block plugin.` );
			//spinner.text = `Updating ${slug} block plugin.`;

			// make tmp directory
			fs.ensureDir( `${slug}.tmp`);

			// move src directory to tmp directory
			fs.copySync(`${slug}/src/`, `${slug}.tmp/src/`);

			// move package.json to tmp directory
			fs.copySync(`${slug}/package.json`, `${slug}.tmp/package.json`);

			// move plugin main entry file to tmp directory
			fs.copySync(`${slug}/${slug}.php`, `${slug}.tmp/${slug}.php`);

			// delete old block.
			fs.removeSync( `${slug}` );

			// Recreate the block.
			await createBlock({spinner, debug, slug});

			// move src directory back to block directory
			fs.copySync(`${slug}.tmp/src/`, `${slug}/src/`);

			// we get new and old package.json files
			let oldPkg = JSON.parse( fs.readFileSync(path.join(`${slug}.tmp`, 'package.json')) )			
			let newPkg = JSON.parse( fs.readFileSync(path.join(slug, 'package.json')) )			
			
			/**
			 * package.json changes
			 * @since 1.3.0 Gulp is no longer used.
			 */
			if( oldPkg.version < '1.3.0' ){

				// remove the old postbuild script. 
				if( oldPkg.scripts.postbuild && 'gulp build' ===  oldPkg.scripts.postbuild ){
					delete oldPkg.scripts.postbuild;
				}
	
				// remove old gulp related packages
				for(const i in oldPkg.devDependencies ){
					if( [
							'del', 'fancy-log', 'gulp', 'gulp-cli', 'gulp-concat', 'gulp-file', 'gulp-line-ending-corrector',
							'gulp-sass', 'gulp-tap', 'gulp-uglify-es', 'sass'
						].includes( i ) ){
						delete oldPkg.devDependencies[i]
					}
				}
			}	
			
			// we only need the dependencies and devDependencies updated.
			fs.writeFileSync(
				path.join(slug, 'package.json'),
				JSON.stringify( {
					...oldPkg,
					dependencies: {
						...oldPkg.dependencies,
						...newPkg.dependencies,
					},
					devDependencies: {
						...oldPkg.devDependencies,
						...newPkg.devDependencies,
					}
				}, null, 4 )
			);

			let oldEntry = fs.readFileSync(path.join(`${slug}.tmp`, `${slug}.php`)).toString()
			let oldHeader = getPluginHeader(oldEntry);
			let newEntry = fs.readFileSync(path.join(slug, `${slug}.php`)).toString();
			let newHeader = getPluginHeader(newEntry);

			// we dont want to update the header case changes we made.
			// we only update the plugin headers require fields.
			let correctedHeader = oldHeader
				.replace(/Requires at .*/, newHeader.match(/Requires at .*/) )
				.replace(/Requires PHP.*/, newHeader.match(/Requires PHP.*/) )

			// replace the header in the new entry with the corrected header and write the file back
			fs.writeFileSync(
				path.join(slug, `${slug}.php`),
				newEntry.replace(newHeader, correctedHeader)
			);

			// delete tmp directory.
			fs.removeSync( `${slug}.tmp` );

			// install block npm packages
			await runCmd(
				'npm',
				[
					'install',
				],
				{
					cwd: path.join(process.cwd(), slug ),
					stdio: 'inherit'
				}
			)

			// build block 
			await runCmd(
				'npm',
				[
					'run',
					'build',
				],
				{
					cwd: path.join(process.cwd(), slug ),
					stdio: 'inherit'
				}
			)

			spinner.text = `${slug} has been updated!`; 

		}else{
			spinner.fail(`${slug} plugin directory not found.`)
		}			
		
};
