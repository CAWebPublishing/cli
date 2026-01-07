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

const webpackAllowedFlags = [
    "-c",
    "--config",
    "--config-name",
    "-m",
    "--merge",
    "--disable-interpret",
    "--env",
    "--node-env",
    "--config-node-env",
    "--analyze",
    "--progress",
    "-j",
    "--json",
    "--fail-on-warnings",
    "-d",
    "--devtool",
    "--no-devtool",
    "--entry",
    "-e",
    "--extends",
    "--mode",
    "--name",
    "-o",
    "--output-path",
    "--stats",
    "--no-stats",
    "-t",
    "--target",
    "--no-target",
    "-w",
    "--watch",
    "--no-watch",
    "--watch-options-stdin",
    "--no-watch-options-stdin",
];

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
    template,
    externals
} ) {
    const webpackCommand = 'build' === process.argv[2] ? 'build' : 'serve' ;
    
    // we use our default config from the @caweb/webpack
    const defaultConfigPath = path.resolve('node_modules', '@caweb', 'webpack', 'webpack.config.js' );
    
    // prepend our default config to the arguments.
    // users can overwrite any values by creating a webconfig of their own.
    let webPackArgs = [
        '--config',
        defaultConfigPath,
        ...process.argv.splice(3),
    ];
    
    // Since we use @wordpress/scripts webpack config we can leverage
    // the environment variables as well.
    process.env.WP_COPY_PHP_FILES_TO_DIST  = true;
    process.env.WP_NO_EXTERNALS = externals;

    // CommonJS
    if( fs.existsSync( path.resolve( 'webpack.config.cjs' ) ) ){
        webPackArgs.push(
            '--config',
            path.resolve('webpack.config.cjs' )
        )

    // ESM
    }else if( fs.existsSync(path.resolve('webpack.config.js' )) ){
        webPackArgs.push(
            '--config',
            path.resolve('webpack.config.js' )
        )

    }

    // add the --merge flag to allow merging configs.
    webPackArgs.push( '--merge' );

    let unknown = false;
    let unkownArgs = [];

    // we have to filter out unknown args to avoid webpack errors
    webPackArgs = webPackArgs.filter( (e) => {
                
                if( e.startsWith('--')  ){
                    // set unknown flag
                    unknown = ! webpackAllowedFlags.includes(e);

                    // save unknown flag
                    if( unknown ){
                        unkownArgs.push(e);
                    }

                    // return if known flag 
                    return webpackAllowedFlags.includes(e);
                }else{
                    // save unknown args
                    if( unknown ){
                        unkownArgs.push(e);
                    }

                    // if flag was known return the value, else false 
                    return ! unknown ? e : false;
                }
            } 
        );

    // run the webpackCommand command.
    await runCmd(
		'webpack', 
		[
            webpackCommand, 
            ...webPackArgs
        ],
        {
            stdio: 'inherit',
            argv0: unkownArgs.join(' ')
        }
	);
};
