/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { 
    runCmd
} from '../../lib/index.js';


/**
 * Build the current project
 * 
 * @param {Object}  options
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.audit   Add CSS-Audit Page to pages served.
 * @param {boolean} options.scheme   Serves the project using template colorscheme.
 * @param {boolean} options.template   Serves the project using templating.
 */
export default async function webpack({
    spinner,
	debug,
    scheme,
    template
} ) {
    const webpackCommand = 'build' === process.argv[2] ? 'build' : 'serve' ;

    // we use our default config from the @caweb/html-webpack-plugin
    const defaultConfigPath = path.resolve('node_modules', '@caweb', 'html-webpack-plugin', 'webpack.config.js' );

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
    if( fs.existsSync( path.resolve( 'webpack.config.cjs' ) ) ){
        webPackArgs.push(
            '--config',
            path.resolve('webpack.config.cjs' ),
            '--merge'
        )

    // ESM
    }else if( fs.existsSync(path.resolve('webpack.config.js' )) ){
        webPackArgs.push(
            '--config',
            path.resolve('webpack.config.js' ),
            '--merge'
        )

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
