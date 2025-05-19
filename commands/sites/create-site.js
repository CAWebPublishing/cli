/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';

/**
 * Internal dependencies
 */
import { appPath, writeLine } from '../../lib/index.js';

import {
	promptForGeneralInfo,
	promptForSocial,
	promptForAlerts,
	promptForHeader,
	promptForFooter
} from './prompts.js';

/**
 * Promisified dependencies
 */

/**
 * Test code.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.siteTitle   Which environment to test in.
 * @param {boolean} options.siteHeaderFeatures   Which environment to test in.
 */
export default async function createSite({
	spinner,
	debug,
	siteTitle
} ) {
		spinner.stop();
		
		let filePath = path.join( appPath, 'caweb.json' );
		let siteData = {};

		// check if the site data file exists
		if( fs.existsSync( filePath ) ) {
			let file = fs.readFileSync( filePath, 'utf8' );
			let data = JSON.parse( file );

			// check if the data file has site data
			if( data.site ) {
				const continueProcess = await confirm(
					{ 
						message: `Site data already exists, existing data will be overwritten.\nWould you like to continue?`,
						default: true
					},
					{
						clearPromptOnDone: true,
					}
				).catch(() => {process.exit(1);});

				// if the user wants to continue, set the site data
				// otherwise exit the process
				if( continueProcess ){
					siteData = data.site;
				}else{
					spinner.fail( 'Site creation cancelled.' );
					process.exit( 0 );
				}
			}
		}

		writeLine('CAWebPublishing Site Creation Process', {char: '#', borderColor: 'green'});
		writeLine('This process will create a site configuration file for CAWebPublishing.', {color: 'cyan', prefix: 'i'});
		writeLine('Please answer the following questions to create your site configuration file.', {color: 'cyan', prefix: 'i'});
		writeLine('You can skip any question by pressing enter.', {color: 'cyan', prefix: 'i'});
		writeLine('You can also edit the configuration file later.', {color: 'cyan', prefix: 'i'});

		// populate the site data
		siteData = {
			...await promptForGeneralInfo(siteTitle),
			header: await promptForHeader(),
			alerts: await promptForAlerts(),
			social: await promptForSocial(),
			footer: await promptForFooter(),
		};

		// write the site data to the file
		fs.writeFileSync(
			path.join( appPath, 'caweb.json' ),
			JSON.stringify( {site:siteData}, null, 4 )
		);

		writeLine('CAWebPublishing Site Creation Process Complete', {char: '#', borderColor: 'green'});
		writeLine('You can now start the site by running the following command:', {color: 'cyan', prefix: 'i'});
		writeLine(`npm run caweb serve`, {color: 'cyan', prefix: 'i'});

		spinner.start('CAWebPublishing Site Configuration file saved.');
		
};
