/**
 * External dependencies
 */
import { select } from 'inquirer-select-pro';
import chalk from 'chalk';
import { writeLine, clearLine } from '../../lib/index.js';

// since we are in a spinner,
// we have to silence all the cancellation errors when using prompts
// .catch(() => {process.exit(1);})
import { confirm, input, password } from '@inquirer/prompts';


const bullet = chalk.yellow('-');
const info = chalk.cyan('i');

/**
 * Default Header Navigation for the site data.
 */
const headerNav = [
    {
        "label": "CAWebPublishing",
        "url": "https://caweb.cdt.ca.gov/",
    },
    {
        "label": "CDT",
        "url": "https://cdt.ca.gov/",
        "sub": [
                    {
                        "label": "Accessibility",
                        "url": "https://caweb.cdt.ca.gov/accessibility-2/",
                        "description": "Accessibility"
                    },
                ]
    }
];

/**
 * Default Utility Links for the site data.
 */
const utilityLinks = [];

/**
 * Default Footer Navigation for the site data.
 */
const footerNav = [
    {
        "label": "Accessibility",
        "url": "https://caweb.cdt.ca.gov/accessibility-2/",
    },
];

/**
 * Default Social Media Platforms for the site data.
 */
const socialPlatforms = {
    email : 'Share via Email',
    facebook: 'Facebook',
    github: 'Github',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    twitter: 'X',
    youtube: 'YouTube',
}

/**
 * Default Link Options for the prompts.
 */
const linkOptions = {
    label: {default: ''},
    target: {default: '_blank'},
    desc: {default: ''}
}

/**
 * Prompt for header configurations
 * 
 * - Utility Header
 * - Navigation
 * 
 * @returns {object}
 */
async function promptForHeader(){
    writeLine('Header Configurations', {color: 'magenta', char: '#', borderColor: 'magenta'});
    writeLine('The following features are available for the header.', {color: 'cyan', prefix: 'i'});
    writeLine('Anything not configured will be set to default settings.', {color: 'cyan', prefix: 'i'});
    
    let defaultFeatures = [{'utility-header': {checked: false}}, {'navigation': {checked: true}}];

    // default header object
    let header = {
        utility: utilityLinks,
        nav: headerNav,
    };

    let options = [];

    // if no features are passed, set the default features
    defaultFeatures.forEach(feature => {
        let keyName = Object.keys(feature)[0];
        let checked = feature[keyName].checked;

        options.push({
            // replace - with space and make first letter upper case
            name: keyName.replace('-', ' ').replace(/^\w| \w/g, c => c.toUpperCase()),
            value: keyName,
            checked
        })
    })

    // prompt for the features to configure
    let features = await select({
            message: 'Select which of the following features you would like to configure...\n',
            multiple: true,
            canToggleAll: true,
            options,
            defaultValue: options.map(o => o.checked ? o.value : false ).filter( e => e)
        }, {clearPromptOnDone: true}).catch(() => {process.exit(1);});

    // if utility-header is selected, prompt for utility header configurations.
    if( features.includes('utility-header') ){

        writeLine('Utility Header', {bold: true});
        writeLine('The Utility Header are 3 custom links that are displayed at the very top of the page.', {color: 'cyan', prefix: 'i'});

        let linkCount = 1;
        let doneUtilityLinks = false;

        // set the header utility to an empty array
        header.utility = [];

        do{

            writeLine(`Utility Link ${linkCount}`, {bold: true});

            header.utility.push( await promptForLink() );

            doneUtilityLinks = await confirm(
                { 
                    message: 'Would you like to add another link?',
                    default: false
                },
                { clearPromptOnDone: true }
            ).catch(() => {process.exit(1);});
        
            // if the user does not want to add another link, break the loop
            if( ! doneUtilityLinks ){
                break;
            }
            // if the user wants to add another link, increment the link count
            linkCount++;
        } while( linkCount < 4 );

        // clear lines for each link plus the link stored message
        // + 2 for the header and info message
        clearLine((linkCount * 3) + 2);
    }

    // if navigation is selected, prompt for navigation configurations.
     if( features.includes('navigation') ){
        
        writeLine('Navigation', {bold: true});
        writeLine('The Navigation is a set of links that are displayed to navigate your site.', {color: 'cyan', prefix: 'i'});
                
        // ask if the user wants to use sample links
        let sampleNavLinks = await confirm(
            { 
                message: 'Would you like to use the sample links?',
                default: true
            },
            { clearPromptOnDone: true }
        ).catch(() => {process.exit(1);});
        
        // if the user does not want to use sample links, prompt for the links
        if( ! sampleNavLinks ){

            // set the header nav to a nav array.
            header.nav = await promptForNavigation();

        }
        
        // clear lines for each link plus the link stored message
        // + 2 for the header and info message
        clearLine((header.nav.length * 3) + 2);
    }

    // clear lines
    clearLine(6);
    writeLine('Header Configurations Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});

    // return the header object
    return header
}

/**
 * Prompt for footer configurations
 * 
 * @returns {object}
 */
async function promptForFooter(){
    // write the header line
    writeLine('Footer Configurations', {color: 'magenta', char: '#', borderColor: 'magenta'});

    // default footer object
    let footer = {
        nav: footerNav,
    };


    // write the footer line
    writeLine('Navigation', {bold: true});
    writeLine('The Navigation is a set of links that are displayed at the bottom of your site.', {color: 'cyan', prefix: 'i'});
                
    // ask if the user wants to use sample links
    let sampleNavLinks = await confirm(
        { 
            message: 'Would you like to use the sample links?',
            default: true
        },
        { clearPromptOnDone: true }
    ).catch(() => {process.exit(1);});
        
    // if the user does not want to use sample links, prompt for the links
    if( ! sampleNavLinks ){

        // set the footer nav to a nav array.
        footer.nav = await promptForNavigation(false);

    }

    // clear lines for each link plus the link stored message
    // + 5 for the header and info message
    clearLine((footer.nav.length * 3) + 5);

    writeLine('Footer Configurations Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});
    
    // return the header object
    return footer
}

/**
 * Prompt for social media links
 * 
 * @returns {object}
 */
async function promptForSocial(){
    let socials = {};
    // write the header line
    writeLine('Social Media Links', {color: 'magenta', char: '#', borderColor: 'magenta'});
    writeLine('The following social media platforms are available.', {color: 'cyan', prefix: 'i'});

    let options = [];

    Object.keys(socialPlatforms).forEach(s => {
        options.push({
            name: socialPlatforms[s],
            value: s,
            checked: false,
        })
    })

    let platforms = await select({
            message: 'Select which of the following social media platforms you would like to configure...\n',
            multiple: true,
            canToggleAll: true,
            options,
            defaultValue: options.map(o => o.checked ? o.value : false ).filter( e => e)
        }, {clearPromptOnDone: true}).catch(() => {process.exit(1);});


    for( const platform of platforms ){
        // prompt for the social media links
        writeLine(socialPlatforms[platform], {bold: true});
        socials[platform] = await promptForLink({});
    }

    // clear lines for each link plus the link stored message
    // + 4 for the header and info message
    clearLine((Object.keys(socials).length * 3) + 4);

    writeLine('Social Media Links Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});

    return socials;
}

/**
 * Prompt for site wide alerts
 * 
 * @returns {object}
 */
async function promptForAlerts(){
    // write the header line
    writeLine('Site Wide Alerts', {color: 'magenta', char: '#', borderColor: 'magenta'});
    writeLine('The site wide alerts appear at the top of the page.', {color: 'cyan', prefix: 'i'});

    let alerts = [];

    // ask if the user wants to add an alert.
    if((await confirm(
                { 
                    message: 'Would you like to add an alert?',
                    default: false
                },
                { clearPromptOnDone: true }
            ).catch(() => {process.exit(1);}))
        ){
            let doneAlerts = false

            do{
                let alert = {
                    icon: await input({ message: 'What is the alert icon?', default: 'info'}).catch(() => {process.exit(1);}),
                    header: await input({ message: 'What is the alert header?'}).catch(() => {process.exit(1);}),
                    msg: await input({ message: 'What is the alert message?'}).catch(() => {process.exit(1);}),
                }


                // ask if the user wants to add a readmore link
                if(
                    await confirm(
                        { 
                            message: 'Would you like to add a read more button?',
                            default: true
                        },
                        { clearPromptOnDone: true }
                    ).catch(() => {process.exit(1);})
                ){
                    writeLine('Read More Link', {bold: true});
                    alert.link = await promptForLink({label:{default: 'Read More'}, target: {default: '_self'}});
                }

                // push the alert to the alerts array
                alerts.push(alert);

                // ask if the user wants to add another alert
                doneAlerts = await confirm(
                    { 
                        message: 'Would you like to add another alert?',
                        default: false
                    },
                    { clearPromptOnDone: true }
                ).catch(() => {process.exit(1);});
                
                // clear lines for each alert field
                // if there's a a link remove only 2 lines, since 1 line is removed due to the link key in the alert object
                clearLine(Object.keys(alert).length + (alert.link ? 2 : 0));

                writeLine('Alert Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});
            }while( doneAlerts );

            // clear lines for each alert plus the alert stored messages
            // + 4 for the header and info message
            clearLine((alerts.length * 3) + 4);

            writeLine('Alerts Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});
        }

    

    return alerts;
}

/**
 * Prompt for generic links
 * 
 * @param {object} opts Additional prompts for the links. Choices are: ['all', 'label', 'target', 'desc']
 * @returns { label, url, target }
 */
async function promptForLink(opts = {label: {}, target: {}}){
    // URL is always prompted for
    // all other options are only prompted if they are in the opts array
    let link =  { 
        url: await input({ 
            message: 'Link URL:', 
            required: true,
            validate: (input) => {
                if( ! input.startsWith('http') && ! input.startsWith('https') ){
                    return 'Link URL must start with http or https.';
                }
                return true;
            } 
        }).catch(() => {process.exit(1);}), 
    }

    let optKeys = Object.keys(opts);    
    
    // if the user want to prompt for all options
    if( optKeys.includes('all') ){
        opts = {
            ...linkOptions,
            ...optKeys.all
        }
    }

    // if the user wants to add a label, prompt for it
    if( optKeys.includes('label') || optKeys.includes('all') ){
        link.label = await input(
            { 
                message: 'Link Label:', 
                required: true, 
                default: opts.label.default ? opts.label.default : '' 
            }
        ).catch(() => {process.exit(1);})
    }

    // if the user wants to add a target, prompt for it
    if( optKeys.includes('target') || optKeys.includes('all') ){
        link.target = await select({
            message: 'Link Target:',
            multiple: false,
            options: [
                { name: '_blank', value: '_blank', checked: ! opts.target.default || opts.target.default === '_blank' },
                { name: '_self', value: '_self', checked: opts.target.default === '_self' },
            ]
        })
        .catch(() => {process.exit(1);})
    }

    // if the user wants to add a description, prompt for it
    if( optKeys.includes('desc') || optKeys.includes('all') ){
        link.description = await input({ message: 'Link Description:' }).catch(() => {process.exit(1);})
    }

    // clear lines for each prompt plus the link main message
    clearLine(Object.keys(link).length + 1);

    writeLine('Link Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});
    return link;
}

/**
 * Prompt for navigation
 * 
 */
async function promptForNavigation(sublinks = true){

    let linkCount = 1;
    let doneNavLinks = false;
    let navigation = [];

    do{
        // main link count message
        writeLine(`Main Link ${linkCount}`, { bold: true});
        
        // prompt for the main link
        let mainLink = await promptForLink();
        
        // ask if the user wants to add sub links
        if( sublinks && await confirm(
                { message: 'Would you like to add sub links?', default: false }, 
                { clearPromptOnDone: true }
            ).catch(() => {process.exit(1);})
        ){

            // set the sub links to an empty array
            mainLink.subLinks = [];
    
            let doneSublinks = false;
            let subLinkCount = 0;
            
            do{
                writeLine(`Sub Link ${subLinkCount + 1}`, {bold: true});
                
                // prompt for the sub link
                mainLink.subLinks.push( await promptForLink({all:{}}) );
                
                // ask if the user wants to add another sub link
                doneSublinks = await confirm(
                    { 
                        message: 'Would you like to add another sub link?',
                        default: false
                    },
                    { clearPromptOnDone: true }
                ).catch(() => {process.exit(1);});
                            
                // increment the sub link count
                subLinkCount++;
            } while( doneSublinks );

                
            // clear lines for each sub link plus the link stored message
            clearLine(subLinkCount * 3);
        }
        
        // push the main link to the navigation array
        navigation.push( mainLink );

        doneNavLinks = await confirm(
            { 
                message: 'Would you like to add another main link?',
                default: true
            },
            { clearPromptOnDone: true }
        ).catch(() => {process.exit(1);});
            
        // clear lines for each main link plus the link stored message
        // clearLine(4);

        // increment the link count
        linkCount++;
    } while( doneNavLinks );

    // return the navigation array
    return navigation;

}

/**
 * Prompt for General Site Information
 * 
 * - Site Title
 * 
 * @param {string} title Site title default.
 * @returns {object}
 */
async function promptForGeneralInfo(title){
   writeLine('General Site Information', {color: 'magenta', char: '#', borderColor: 'magenta'});

   let info = {
    title: await input({
            message: 'What is the title of the site?',
            default: title,
            required: true,
        },
        {
            clearPromptOnDone: true,
        }
    ).catch(() => {process.exit(1);})
   };

    // clear lines.
    clearLine(3);

    writeLine('General Site Information Stored.', {color: 'yellow', char: '#', borderColor: 'yellow'});
    return info;
}

export {
    bullet,
    info,
    promptForGeneralInfo,
    promptForSocial,
    promptForAlerts,
    promptForHeader,
    promptForFooter
}