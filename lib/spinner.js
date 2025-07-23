/**
 * External dependencies
 */
import chalk from 'chalk';
import ora from 'ora';
import terminalLink from  'terminal-link';

// Colors.
const boldWhite = chalk.bold.white;
const wpPrimary = boldWhite.bgHex( '#00669b' );
const wpGreen = boldWhite.bgHex( '#4ab866' );
const wpRed = boldWhite.bgHex( '#d94f4f' );
const wpYellow = boldWhite.bgHex( '#f0b849' );

// Spinner.
const withSpinner =
	( command ) =>
	( ...args ) => {
		const spinner = ora().start();

		// commander passes arguments/options differently than yargs.
		// lets combine arguments with options
		const cmd = args.pop();

		if( cmd.registeredArguments ){
			cmd.registeredArguments.forEach(arg => {
				// get arg from list.
				let v = args.shift();
	
				// add arg to options.
				args[args.length - 1][arg._name] = v;
			});
		}
		

		// add any global options.
		args[0] = {
			...args[0],
			...cmd.parent.opts()
		}

		args[ 0 ].spinner = spinner;
		let time = process.hrtime();
		return command( ...args ).then(
			( message ) => {
				time = process.hrtime( time );
				spinner.succeed(
					`${ message || spinner.text } (in ${ time[ 0 ] }s ${ (
						time[ 1 ] / 1e6
					).toFixed( 0 ) }ms)`
				);
				process.exit( 0 );
			},
			( error ) => {

				// Axios Error
				if( error &&
					'object' === typeof error &&
					'response' in error &&
					'request' in error 
				){

					let { data, status } = error.response;
					let msg = data.message || 'An unknown error occurred.';

					if( 401 === status ){
						msg +=  `\nPlease check your ${terminalLink('Application Password', 'https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/')}`;
					} else if( 403 === status ){
						msg =  'Forbidden Request: A potentially unsafe operation has been detected in your request to this site';
					}

					spinner.fail( msg )

				// An Error was thrown.
				}else if( error && 'object' === typeof error ){
					// Error is a docker compose error. That means something docker-related failed.
					// https://github.com/PDMLab/docker-compose/blob/HEAD/src/index.ts
					if(
						'exitCode' in error &&
						'err' in error &&
						'out' in error
					){
						spinner.fail(
							'Error while running docker compose command.'
						);
						if ( error.out ) {
							console.log( error.out );
						}
						if ( error.err ) {
							console.error( error.err );
						}
					}else{
						// If the error has a message, use that.
						spinner.fail(
							typeof error === 'string' ? error : error.message
						);
					}

				// Error is an unknown error. That means there was a bug in our code.
				}else{
					spinner.fail( 'An unknown error occurred.' );

					// Using console.error() means we get a stack trace.
					console.error( error );

				}

				process.exit( 1 );

			}
		);
	};

export {
    wpPrimary,
    wpGreen,
    wpRed,
    wpYellow,
    withSpinner
}