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
} from '../../lib/index.js';

/**
 * Build the current project
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function webpack({
	spinner,
	debug, 
} ) {

    // Spinner not needed at the moment
	//spinner.stop()

    const webpackCommand = 'build' === process.argv[2] ? 'build' : 'serve' ;

    // Since we use @wordpress/scripts webpack config we can leverage
    // the environment variables as well.
    process.env.WP_COPY_PHP_FILES_TO_DIST  = true;

    // pass any arguments from the cli
    // add our default config as an extension.
    // users can overwrite any values by creating a webconfig of their own.
    let webPackArgs = [
        webpackCommand,
        '--config',
        path.join( projectPath, 'configs', 'webpack.config.js' ),
        ...process.argv.slice(3)
    ];


    // Added arguments if serving.
    if( 'serve' === webpackCommand ){
        webPackArgs.push(
            '--open',
        )
    }

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
	).then(({stdout, stderr}) => {
        // if an error was thrown, and no output
        if( stderr && ! stdout.toString() ){
            console.log( stderr.toString() )
        }else{
            spinner.text = 'Done'
        }

    });

};
