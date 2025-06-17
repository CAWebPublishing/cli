/**
 * External dependencies
 */
import { select } from 'inquirer-select-pro';
import chalk from 'chalk';
import { writeLine, clearLine } from '../lib/index.js';

// since we are in a spinner,
// we have to silence all the cancellation errors when using prompts
// .catch(() => {process.exit(1);})
import { confirm, input, password } from '@inquirer/prompts';


const bullet = chalk.yellow('-');
const info = chalk.cyan('i');

/**
 * Prompt for General Site Information
 * 
 * - Site Title
 * 
 * @param {string} title Site title default.
 * @returns {object}
 */
async function promptForDivi(){
    writeLine('CAWebPublishing requires that Divi be installed in order to function properly', { char: '#', borderColor: 'blue'});
    writeLine('Divi Credentials', {color: 'magenta', char: '#', borderColor: 'magenta'});
    writeLine('The following credentials are required to download and install Divi.', {color: 'cyan', prefix: 'i'});
    writeLine('By not providing appropriate credentials, you may encounter issues.', {color: 'cyan', prefix: 'i'});
    let info = {
        ET_USERNAME: await input({
                message: 'Elegant Themes Username:',
            },
            {
                clearPromptOnDone: true,
            },
        ).catch(() => {
            // clear lines.
            clearLine(8);
            process.exit(1);
        }),
        ET_API_KEY: await password({
                message: 'Elegant Themes API Key:',
            },
            {
                clearPromptOnDone: true,
            },
        ).catch(() => {
            // clear lines.
            clearLine(8);
            process.exit(1);
        })
   };

    // clear lines.
    clearLine(8);
    return info;
}

export {
    bullet,
    info,
    promptForDivi,
}