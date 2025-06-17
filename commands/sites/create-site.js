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
import { appPath, writeLine, clearLine } from '../../lib/index.js';

import {
	promptForGeneralInfo,
	promptForSocial,
	promptForGoogleOptions,
	promptForAlerts,
	promptForHeader,
	promptForFooter
} from './prompts.js';

/**
 * Promisified dependencies
 */

/**
 * Creates a new CAWebPublishing Site Configuration file
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.siteTitle   Site Title.
 * @param {boolean} options.silent   Runs the site creation process without prompts, this is useful for CI/CD pipelines.
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
		// prompt for each section
		siteData = {
			...await promptForGeneralInfo(siteTitle),
			header: await promptForHeader(),
			alerts: await promptForAlerts(),
			social: await promptForSocial(),
			google: await promptForGoogleOptions(),
			footer: await promptForFooter(),
		};

		// write the site data to the file
		fs.writeFileSync(
			path.join( appPath, 'caweb.json' ),
			JSON.stringify( {site:siteData}, null, 4 )
		);

		// if there is no src directory, create it
		if( ! fs.existsSync( path.join( appPath, 'src' ) ) ) {
			fs.mkdirSync( path.join( appPath, 'src' ) );

			// create the index.js file
			fs.writeFileSync(
				path.join( appPath, 'src', 'index.js' ),
				`// This is the main entry point for your CAWebPublishing site.\n// You can start coding your site here.\n\nconsole.log('Welcome to your CAWebPublishing site!');`
			);
		}

		// create content/pages directory if it doesn't exist
		if( ! fs.existsSync( path.join( appPath, 'content', 'pages' ) ) ) {
			fs.mkdirSync( path.join( appPath, 'content', 'pages' ), { recursive: true });
		}
		
		// create media directory if it doesn't exist
		if( ! fs.existsSync( path.join( appPath, 'media' ) ) ) {
			fs.mkdirSync( path.join( appPath, 'media' ) );
		}

		// clearLines for stored messages
		// clearlines = (6 * 3) + 7
		// (sectionCount * storedMessageLines) + Intro Lines
		clearLine( (6 * 3) + 7 );

		writeLine('CAWebPublishing Site Creation Process Complete', {char: '#', borderColor: 'green'});
		writeLine('You can now start the site by running the following command:', {color: 'cyan', prefix: 'i'});
		writeLine(`npm run caweb serve`, {color: 'cyan', prefix: 'i'});

		spinner.text = `CAWebPublishing Site Configuration file saved at ${path.join( appPath, 'caweb.json' )}.`;

};
