#!/usr/bin/env node

/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import deepmerge from 'deepmerge';
import Webpack from 'webpack';
import webpackServer from 'webpack-dev-server';
/**
 * Internal dependencies
 */
import { 
    runCmd, 
    projectPath,
    appPath,
    wpPrimary,
    wpGreen,
    wpRed
} from '../../lib/index.js';

// WordPress CSS Audit tool
import {default as auditor} from '../audit.js';


/**
 * Build the current project
 * 
 * @param {Object}  options
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.audit   Add CSS-Audit Page to pages served.
 */
export default async function webpack({
	debug, 
    audit,
    a11y
} ) {
    
    const webpackCommand = 'build' === process.argv[2] ? 'build' : 'serve' ;

    const defaultConfigPath = path.join( projectPath, 'configs', 'webpack.config.js' );
    let webpackConfig = await import('file://' + defaultConfigPath);
    let customConfig = {};

    // Since we use @wordpress/scripts webpack config we can leverage
    // the environment variables as well.
    process.env.WP_COPY_PHP_FILES_TO_DIST  = true;

    // pass any arguments from the cli
    // add our default config as an extension.
    // users can overwrite any values by creating a webconfig of their own.
    let webPackArgs = [
        '--config',
        defaultConfigPath,
    ];
    
    // CommonJS
    if( fs.existsSync( path.join(appPath, 'webpack.config.cjs' ))){
        webPackArgs.push(
            '--config',
            path.join(appPath, 'webpack.config.cjs' ),
            '--merge'
        )

        customConfig = await import('file://' + path.join(appPath, 'webpack.config.cjs' )).default;

    // ESM
    }else if( fs.existsSync(path.join(appPath, 'webpack.config.js' )) ){
        webPackArgs.push(
            '--config',
            path.join(appPath, 'webpack.config.js' ),
            '--merge'
        )

        customConfig = await import('file://' + path.join(appPath, 'webpack.config.js' ));
    }

    if( customConfig.length ){
        webpackConfig = deepmerge(webpackConfig.default, customConfig.default);
    }
    
    // we always run the build command.
    let result = await runCmd(
		'webpack', 
		['build', ...webPackArgs]
	).then(({stdout, stderr}) => {
        // we hide the punycode deprecation warning.
        // this is caused by the wp-scripts package
        // if an error was thrown
        if( stderr ){
            //console.log( stderr.toString().replace(/.*`punycode`.*\n.*/, '') )
        }
        
        if(stdout){
            return stdout.toString().replace(/.*`punycode`.*\n.*/, '');
        }

    });

    // if serving.
    if( 'serve' === webpackCommand ){
        let hostUrl = 'localhost' === webpackConfig.default.devServer.host ? `http://${webpackConfig.default.devServer.host}`: webpackConfig.default.devServer.host;
        let hostPort = webpackConfig.default.devServer.port;

        if( hostPort && 80 !== hostPort )
        {
            hostUrl = `${hostUrl}:${hostPort}`;
        }        
        
        console.log( `Webpack Server is preparing to launch ${ wpGreen(hostUrl) }` );
        console.log( `Press ${ wpRed('Ctrl + C') } to shutdown the server.\n` );

         // run css-auditor
         if( audit ){
            //await auditor({ spinner, debug });

        }
        
        // run webpack serve command
        await runCmd(
            'webpack', 
            ['serve', ...webPackArgs],
            {
                stdio: 'inherit'
            }
        ).then(({stdout, stderr}) => {
            // if an error was thrown, and no output
            if( stderr && ! stdout){
                console.log( stderr.toString() )
            }
            
            if( stdout ){
                spinner.text = "Webpack Server was closed.";
            }
    
        });

        /*
        const compiler = Webpack(webpackConfig.default);
        const server = new webpackServer({...webpackConfig.default.devServer}, compiler);
       */
       
    // only build was ran.
    }else{
        //spinner.prefixText = result;
        //spinner.text = "Done!";
    }

};
