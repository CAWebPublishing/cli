import chalk from 'chalk';
import ora from 'ora';

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

		cmd.registeredArguments.forEach(arg => {
			// get arg from list.
			let v = args.shift();

			// add arg to options.
			args[args.length - 1][arg._name] = v;
		});

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
				if( error ){
					// Error is an unknown error. That means there was a bug in our code.
					spinner.fail(
						typeof error === 'string' ? error : error.message
					);
					// Disable reason: Using console.error() means we get a stack trace.
					console.error( error );
					process.exit( 1 );
				}else{
					spinner.fail( 'An unknown error occurred.' );
					process.exit( 1 );
				}
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