/**
 * External dependencies
 */
import { select } from 'inquirer-select-pro';
import chalk from 'chalk';

// since we are in a spinner,
// we have to silence all the cancellation errors when using prompts
// .catch(() => {process.exit(1);})
import { confirm, input, password } from '@inquirer/prompts';

const bullet = chalk.yellow('-');
const info = chalk.cyan('i');

/**
 * Prompt for instance information
 * { user, pwd, url }
 * 
 * @asyncc
 * @returns {Prompt}
 */
async function promptGetInstanceInfo(){
    return {
        user: await input({ message: "User Name:" }).catch(() => {process.exit(1);}),
        pwd: await password({ message: 'Application Password:' }).catch(() => {process.exit(1);}),
        url: await input({ message: 'URL:' }).catch(() => {process.exit(1);}),
    };
}


/**
 * Prompt for saving information
 * 
 * @async
 * @returns {Prompt}
 */
async function promptSaveInstanceInfo(){
    let answer = await confirm(
        { 
            message: 'Would you like to save this information?',
            default: true
        }
    ).catch(() => {process.exit(1);});

    if( answer ){
        // ask instance nickname
        return await input({ message: "Instance Nickname:" }).catch(() => {process.exit(1);})
    }
}

async function promptForSync(tax){
    console.log(`Sync WordPress Instances\n${chalk.green('#'.repeat(25))}\n`);

    console.log(chalk.red('Requirements:'));
    console.log(bullet, 'Both instances must have the CAWebPublishing Development Toolbox WordPless plugin installed and activated');
    console.log(bullet.repeat(2), 'Plugin can be found https://github.com/CAWebPublishing/caweb-dev/releases');
    console.log(bullet, 'An application password must be setup for the username');
    console.log(bullet.repeat(2), 'For more information regarding application password https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/');
    
    console.log(chalk.cyan('\nNotes:'));
    // syncing menus note.
    console.info(info, 'If Menus is selected, the following will also be synced:');
    console.info(bullet, 'Any pages/posts (including parents) in the menu items.');

    // syncing pages/posts note.
    console.info(info, 'If Pages/Posts is selected, the following will also be synced:');
    console.info(bullet, 'Any media that is attached.');
    console.info(bullet, 'Any parent pages.');

    console.log('');

    let taxonomies = ['Media', 'Menus', 'Pages', 'Posts', 'Settings'];
    let options = [];

    taxonomies.forEach(t => {
        options.push({
            name: t,
            value: t.toLowerCase(),
            checked: tax.includes(t.toLowerCase())
        })
    })
    return await select({
        message: 'Select from the following taxonomies...',
        multiple: true,
        canToggleAll: true,
        options,
        defaultValue: options.map(o => o.checked ? o.value : false ).filter( e => e)
      }).catch(() => {process.exit(1);});
}

async function promptForId(title){
    console.log(chalk.cyan('i'), `Enter comma separated list of IDs for ${title}`)
    return await input({
        message: 'Which IDs would you like to sync?',
        default: 'all',
        value: 'test'
    }).catch(() => {process.exit(1);});
}

export {
    bullet,
    info,
    promptGetInstanceInfo,
    promptSaveInstanceInfo,
    promptForSync,
    promptForId
}