/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { format } from 'util';

/**
 * Internal dependencies
 */
import { runCLICmds } from '../../helpers.js';
import { configureWordPress } from '../wordpress.js';
import { isCAWeb, configureCAWeb } from './caweb.js';
import { isDivi, configureDivi } from './divi.js';


function processArgs( arr ){
  let tmp = [];

  arr.filter(Boolean).map((o) => {
    return o.replaceAll("'", '').split('=').forEach((e => tmp.push(e)))
  });

  return tmp
}

function flagExists(flag){
  return flags.includes(flag)
}

function getArgVal(flag){
  return flagExists(flag) ? flags[flags.indexOf(flag) + 1] : false;
}

let flags = [].concat(
    processArgs(process.argv),
    // the following can be uncommented if ever needed to process those args.
    // processArgs(process.argv0.split(' ')),
    // processArgs(process.env)
    // processArgs(process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS.split(' ') : []),
)

const workingDirectoryPath = getArgVal('--cwd') ? getArgVal('--cwd') : process.cwd();

// Collect existing wp-config.php values.
process.stdout.write('Collecting CAWeb configuration data...');
let configs = {};
  JSON.parse(
        await runCLICmds({ 
            environment: 'development',
            cmds: ['wp config list --format=json'],
            cwd: workingDirectoryPath
        })
    ).forEach( ( item ) => {
        configs[item.name] = item.value;
    });

    
let cawebInstalled = await isCAWeb({ 
        environment: 'development',
        cwd: workingDirectoryPath,
        is: 'installed'
    });

let diviInstalled = await isDivi({ 
        environment: 'development',
        cwd: workingDirectoryPath,
        is: 'installed'
    });

let multisite = flagExists('--multisite') ? getArgVal('--multisite') : false;
// wp cli commands that will be ran.
// process.stdout.write(`\nConfiguring WordPress...\n`);
let cmds = [
    ...await configureWordPress({
        environment: 'development',
        cwd: workingDirectoryPath,
        multisite,
        configs
    })
];

// Download any resources required for CAWeb.
 if( cawebInstalled ){   

    // if multisite set default theme to CAWeb
    // this allows for any new sites created to use CAWeb as the default theme.
    cmds.push('wp config set WP_DEFAULT_THEME CAWeb');

    // Delete all default themes.
    let defaultThemes = [ 
        'twentyten', 
        'twentyeleven', 
        'twentytwelve',
        'twentythirteen',
        'twentyfourteen', 
        'twentyfifteen', 
        'twentysixteen',
        'twentyseventeen',
        'twentynineteen',
        'twentytwenty', 
        'twentytwentyone', 
        'twentytwentytwo', 
        'twentytwentythree', 
        'twentytwentyfour', 
        'twentytwentyfive' 
    ];

    cmds.push( `wp theme delete ${defaultThemes.join(' ')} --force` );

    // If Elegant Themes credentials are available, download Divi.
    if( configs.ET_USERNAME && configs.ET_API_KEY && ! diviInstalled ){
        // generate Divi download URL.
        let et_url = `https://www.elegantthemes.com/api/api_downloads.php?api_update=1&theme=%s&api_key=${configs.ET_API_KEY}&username=${configs.ET_USERNAME}`;

        // add command to install Divi theme.
        cmds.push( `wp theme install '${format( et_url, 'Divi' )}' --force` );

        // add command to install Divi Builder plugin.
        cmds.push( `wp plugin install '${format( et_url, 'divi-builder' )}' --force` );
    }

    // Activate CAWeb theme.
    cmds.push( 'wp theme activate CAWeb' );

    // Configure CAWeb and Divi options.
    cmds.push(
        ...await configureCAWeb({
            environment: 'development',
            cwd: workingDirectoryPath,
            configs,
        }),
        ...await configureDivi({
            environment: 'development',
            cwd: workingDirectoryPath,
            configs,
        })
    );

    process.stdout.write(`\nConfiguring CAWeb...\n`);
    await runCLICmds({ 
        environment: 'development',
        cmds,
        cwd: workingDirectoryPath,
        debug: true
    });
}