/**
 * External dependencies
 */
import { format } from 'util';
import { getArgVal } from '@caweb/webpack/lib/args.js';

/**
 * Internal dependencies
 */
import { runCLICmds } from '../../helpers.js';
import { configureWordPress } from '../wordpress.js';
import { isCAWeb, configureCAWeb } from './caweb.js';
import { isDivi, configureDivi } from './divi.js';

const workingDirectoryPath = getArgVal('--cwd', process.cwd() );

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

let multisite = getArgVal('--multisite', false );

process.stdout.write(`\nConfiguring WordPress...\n`);
await configureWordPress({
        environment: 'development',
        cwd: workingDirectoryPath,
        multisite,
        configs
    })


// Download any resources required for CAWeb.
 if( cawebInstalled ){   
    let cmds = [];

    // if multisite set default theme to CAWeb
    // this allows for any new sites created to use CAWeb as the default theme.
    if( multisite ){
        cmds.push('wp config set WP_DEFAULT_THEME CAWeb');
    }

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

    // make additional configurations.
    await runCLICmds({ 
        environment: 'development',
        cmds,
        cwd: workingDirectoryPath,
        debug: true
    });

    // Configure CAWeb and Divi options.
    process.stdout.write(`\nConfiguring CAWeb...\n`);
    await configureCAWeb({
            environment: 'development',
            cwd: workingDirectoryPath,
            configs,
        })
    await configureDivi({
            environment: 'development',
            cwd: workingDirectoryPath,
            configs,
        })

}