#!/usr/bin/env node

/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { 
    projectPath,
    appPath,
    runCmd
 } from '../lib/index.js';

/**
 * Serves the current project
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.template   Disables inclusion of the template page header & footer, starting off with a plain html page.
 */
export default async function serve({
	spinner,
	debug,
	template,
} ) {
    spinner.stop();
    
    // Since we use @wordpress/scripts webpack config we can leverage
    // the environment variables as well.
    process.env.WP_COPY_PHP_FILES_TO_DIST  = true;


    // This lets the parser know to include the template 
    // Otherwise we load a blank html page
    process.env.CDT_TEMPLATE = template;
    
    // Let our webpack config know it's serving not building
    process.env.CAWEB_SERVE = true;

   // Our default Webpack Configuration 
   const defaultConfig = path.join( projectPath, 'configs', 'webpack.config.js' );

   let webPackArgs = [
      'serve',
      '--open',
      '--mode=none',
      '--config',
      defaultConfig
    ];

   // merge user configurations
   // CommonJS
   if( fs.existsSync(path.join( appPath, 'webpack.config.cjs' ))){
       webPackArgs.push(
           '--config',
           path.join( appPath, 'webpack.config.cjs' ),
           '--merge'
       )
   // ESM
   }else if( fs.existsSync(path.join( appPath, 'webpack.config.js' )) ){
       webPackArgs.push(
           '--config',
           path.join( appPath, 'webpack.config.js' ),
           '--merge'
       )
   }

    // run webpack with our configuration.
    await runCmd(
		  'webpack', 
      webPackArgs
    ).then(({stdout, stderr}) => {
        // if an error was thrown, and no output
        if( stderr && ! stdout.toString() ){
            console.log( stderr.toString() )
        }else{
            spinner.text = 'Done'
        }
    });
    

};
