// this file is used to add any custom webpack plugins to the serve process.
/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';

import CAWebHTMLPlugin from "@caweb/html-webpack-plugin";
import CAWebA11yPlugin from '@caweb/a11y-webpack-plugin';
import CAWebCSSAuditPlugin from '@caweb/css-audit-webpack-plugin';
import CAWebJSHintPlugin from '@caweb/jshint-webpack-plugin';

import { flagExists, getArgVal } from '@caweb/webpack/lib/args.js';


// this is the path to the current project directory
const appPath = process.cwd();

let templatePath = path.join(appPath, 'node_modules', '@caweb', 'template');

// we read the app caweb.json file if it exists
let caweb = fs.existsSync( path.join(appPath, 'caweb.json') ) ? 
JSON.parse(fs.readFileSync(path.join(appPath, 'caweb.json'))) 
: {};

// argument variables
let template = getArgVal( 'template', path.join(templatePath, 'patterns', 'default.html') );
let searchTemplate = getArgVal( 'search-template', path.join(templatePath, 'patterns', 'search.html') );
let scheme = getArgVal( 'scheme', 'oceanside' );

// Additional pages directory
let basePageDir = path.join(appPath, 'content', 'pages');
let additionalPages = ! fs.existsSync( basePageDir ) ? [] :
            fs.readdirSync( basePageDir, { withFileTypes: true, recursive: true } )
            .filter( dirent => dirent.isFile() && (dirent.name.endsWith('.html') || dirent.name.endsWith('.handlebars')) )
            .map( ( dirent ) => {

                let fileTemplate = path.join( dirent.parentPath, dirent.name );

                // replace .html, uppercase the first letter of each word
                // this is to make sure the title is readable
                // and not just a file name
                let title = dirent.name.replace('.html', '').replace(/\b\w/g, c => c.toUpperCase());
                let content = fs.readFileSync( fileTemplate, 'utf-8' );
                let data = {
                    ...caweb.site,
                    scheme
                };
                let compiler = Handlebars.compile( content );
                let compiledContent = compiler(data);

                return new CAWebHTMLPlugin({
                    template,
                    filename: fileTemplate.replace(basePageDir, '') ,
                    title,
                    templateParameters: {
                        scheme,
                        partial: compiledContent,
                    },

                });
        })

export default {

    plugins: [
        // add custom plugins here
        // Used for Site Generation
        new CAWebHTMLPlugin({
            template,
            templateParameters: {
                scheme,
            },
        }),

        // this plugin generates Search Results page using the template found in patterns/search.html
        caweb?.site?.google?.search ? new CAWebHTMLPlugin({
            template: searchTemplate,
            // favicon,
            filename: 'serp.html',
            title: 'Search Results Page',
            templateParameters: {
                scheme 
            },
        }) : false,
        
        // Additional pages from content/pages directory
        ...additionalPages,

        // // IBM Accessibility
        flagExists('a11y') && getArgVal('a11y') && new CAWebA11yPlugin(),

        // // WP CSS Auditor
        flagExists('audit') && getArgVal('audit') && new CAWebCSSAuditPlugin(),

        // // JSHint
        flagExists('jshint') && getArgVal('jshint') && new CAWebJSHintPlugin(),
        
    ].filter( Boolean ),
}