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
    runCmd, 
    projectPath,
    appPath
} from '../lib/index.js';


/**
 * Build the current project
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function build({
	spinner,
	debug, 
} ) {

    // Spinner not needed at the moment
	spinner.stop()

    // Since we use @wordpress/scripts webpack config we can leverage
    // the environment variables as well.
    process.env.WP_COPY_PHP_FILES_TO_DIST  = true;

    // Our default Webpack Configuration 
    const defaultConfig = path.join( projectPath, 'configs', 'webpack.config.js' );

    // pass any arguments from the cli
    // add our default config as an extension.
    // users can overwrite any values by creating a webconfig of their own.
    let webPackArgs = [
        '--mode=none',
        '--progress',
        '--config',
        defaultConfig
    ];

    // CommonJS
    if( fs.existsSync( path.join(appPath, 'webpack.config.cjs' ))){
        webPackArgs.push(
            '--config',
            path.join(appPath, 'webpack.config.cjs' ),
            '--merge'
        )
    // ESM
    }else if( fs.existsSync(path.join(appPath, 'webpack.config.js' )) ){
        webPackArgs.push(
            '--config',
            path.join(appPath, 'webpack.config.js' ),
            '--merge'
        )
    }

    // run webpack with our arguments.
    await runCmd(
		'webpack', 
		webPackArgs, 
	)

};
