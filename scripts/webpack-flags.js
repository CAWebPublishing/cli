import fs from 'fs';
import path from 'path';
import { runCmd } from '../lib/index.js';

let buildHelp = []
let serveHelp = []

// Get webpack build help
let help = await runCmd(
		'webpack', 
		[
            'build', 
            '--help'
        ],
        {
            stdio: 'pipe',
        }
	);

// parse build help output
parseHelpOutput( help, buildHelp );

// Get webpack serve help
help = await runCmd(
		'webpack', 
		[
            'serve', 
            '--help'
        ],
        {
            stdio: 'pipe',
        }
	);

// parse serve help output
parseHelpOutput( help, serveHelp );

// write the webpack-flags.js file
fs.writeFileSync(
    path.join(process.cwd(), 'commands', 'webpack', 'webpack-flags.js'),
    [
        '// This file is auto-generated via "npm run update:webpack:flags"',
        `const buildFlags = ${JSON.stringify( buildHelp, null, 4 )};\n`,
        `const serveFlags = ${JSON.stringify( serveHelp, null, 4 )};\n`,
        'export { buildFlags, serveFlags };',
    ].join('\n') 
);

// Parse help output
function parseHelpOutput( output, helpArray ) {
    output.stdout.toString()
        .split('\n') // split into lines
        .filter( line => line.trim().startsWith('-') || line.trim().startsWith('--') ) // keep only lines that start with - or --
        .map( line => { 
            line = line
            .trim() // Remove leading/trailing whitespace
            .replace(/\s\s+\w.*/, '') // Strip description after the flag
            .replace(/ [\[<].*/, '') // Remove flag arguments
            .split(', ') // Split multiple flags into an array
            .map( flag => helpArray.push( flag.trim() ) ) // Add each flag to the helpArray.
        } );
}

