/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { 
    appPath,
    projectPath,
    runCmd
} from '../../lib/index.js';


/**
 * Build the current project
 * 
 * @param {Object}  options
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.audit   Add CSS-Audit Page to pages served.
 */
export default async function webpack({
    spinner,
	debug, 
} ) {
    const webpackCommand = 'build' === process.argv[2] ? 'build' : 'serve' ;

    // we use our default config from the @caweb/html-webpack-plugin
    const defaultConfigPath = path.resolve(projectPath, '..', 'webpack', 'webpack.config.js' );
    let webpackConfig = await import('file://' + defaultConfigPath);
    let customConfig = {};

    // Since we use @wordpress/scripts webpack config we can leverage
    // the environment variables as well.
    process.env.WP_COPY_PHP_FILES_TO_DIST  = true;

    // add our default config as an extension.
    // users can overwrite any values by creating a webconfig of their own.
    let webPackArgs = [
        '--config',
        defaultConfigPath
    ].filter(e => e);

    // CommonJS
    if( fs.existsSync( path.join(appPath, 'webpack.config.cjs' ) ) ){
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
        
    // run the webpackCommand command.
    await runCmd(
		'webpack', 
		[
            webpackCommand, 
            ...webPackArgs
        ],
        {
            stdio: 'inherit',
            argv0: process.argv.join(' ')
        }
	);
};
