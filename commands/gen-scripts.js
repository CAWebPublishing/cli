/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';

/**
 * Internal dependencies
 */


/**
 * Generate Scripts.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function genScripts({
	spinner,
	debug,
	environment
} ) {
	let packageFile = path.join( process.cwd(), 'package.json' );

	if( ! fs.existsSync( packageFile ) ) {
		if( debug ) {
			console.error( "No package.json found in the current directory." );
		}
		return;

	// only if the package.json file exists
	}else{
		
		let obj = JSON.parse( fs.readFileSync( packageFile ) );
		let scripts = obj.scripts || {};
		let basicScripts = {
			"caweb": "caweb",
			"create-site": "caweb create-site",
			"serve": "caweb serve",
			"build": "caweb build",
			"convert-site": "caweb convert-site",
			"launch": "caweb launch",
			"launch:multi": "caweb launch --multisite",
			"launch:multi:subdomain": "caweb launch --multisite --subdomain",
			"launch:sync": "caweb launch --sync --update --bare",
			"launch:update": "caweb launch --update",
			"stop": "caweb stop",
			"shutdown": "caweb destroy",
		};

		obj.scripts = {
			...scripts,
			...basicScripts
		}

		fs.writeFileSync(
			packageFile,
			JSON.stringify( obj, null, 4 )
		);

		spinner.text = "Scripts generated successfully.";
	}


};
