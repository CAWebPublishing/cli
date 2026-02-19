// this file is used to add any custom webpack plugins to the serve process.
/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import SitemapWebpackPlugin    from 'sitemap-webpack-plugin';

import CAWebHTMLPlugin from "@caweb/html-webpack-plugin";
import CAWebA11yPlugin from '@caweb/a11y-webpack-plugin';
import CAWebCSSAuditPlugin from '@caweb/css-audit-webpack-plugin';
import CAWebJSHintPlugin from '@caweb/jshint-webpack-plugin';
import { XMLParser } from 'fast-xml-parser';
import Handlebars from '@caweb/webpack/lib/handlebars.js';

import { flagExists, getArgVal, flags } from '@caweb/webpack/lib/args.js';

// this is the path to the current project directory
const appPath = process.cwd();

let templatePath = path.join(appPath, 'node_modules', '@caweb', 'template');

// we read the app caweb.json file if it exists
let caweb = fs.existsSync( path.join(appPath, 'caweb.json') ) ? 
JSON.parse(fs.readFileSync(path.join(appPath, 'caweb.json'))) 
: {};

// argument variables
let template = getArgVal( 'template', path.join(templatePath, 'patterns', 'default.html') );

let scheme = getArgVal( 'scheme', 'oceanside' );

// Template patterns
let patterns = fs.readdirSync(path.join(templatePath, 'patterns'), { withFileTypes: true } )
    .filter( dirent => dirent.isFile() && (dirent.name.endsWith('.html') ) )
    .map( ( dirent ) => {

                let fileTemplate = path.join( dirent.parentPath, dirent.name );
                let filename = fileTemplate.replace(path.join(templatePath, 'patterns'), '').replace(/^[\\\/]/, '');

                // we ignore the default and blank patterns since those are used as templates and not actual pages
                // if there is no Google Search Id we ignore the search pattern since that is only used for the Search Results page
                if ( 
                    ['default.html', 'blank.html'].includes( filename ) ||  
                    (filename === 'serp.html' && ! caweb?.site?.google?.search)
                ) {
                    return false;
                }

                return {
                    file: fileTemplate,
                    filename,
                };
    })
    .filter( Boolean );
    
// Additional pages directory
let basePageDir = path.join(appPath, 'content', 'pages');

let additionalPages = ! fs.existsSync( basePageDir ) ? [] :
            fs.readdirSync( basePageDir, { withFileTypes: true, recursive: true } )
            .filter( dirent => dirent.isFile() && (dirent.name.endsWith('.html') || dirent.name.endsWith('.handlebars')) )
            .map( ( dirent ) => {

                let fileTemplate = path.join( dirent.parentPath, dirent.name );
                let filename = fileTemplate.replace(basePageDir, '').replace(/^[\\\/]/, '');

                // if additionl pages match a pattern page we remove ours
                let override = patterns.find( (p) => p.filename === filename );
                if( override ){
                    patterns = patterns.filter( (p) => p.filename !== filename );
                }

                return {
                    file: fileTemplate,
                    filename,
                    template,
                }    
        })

let customPages = [...patterns, ...additionalPages ].filter( Boolean );

export default {
   
    plugins: [
        // add custom plugins here
        // Used for Site Generation
        // when using the CAWebHTMLPlugin we dont have to pass the caweb.site data since that is automatically done by the plugin, we just need to pass the scheme so that it can be used in the templates
        new CAWebHTMLPlugin({
            template,
            templateParameters: {
                scheme,
            },
        }),

        // Additional pages from content/pages directory
        ...customPages.map( (page) => {
            // replace .html, uppercase the first letter of each word
            // this is to make sure the title is readable
            // and not just a file name
            let title = page.filename.replace('.html', '').replace(/\b\w/g, c => c.toUpperCase());
            let content = fs.readFileSync( page.file, 'utf-8' );
            
            let data = {
                    ...caweb.site,
                    scheme,
                };
            
            let compiler = Handlebars.compile( content );
            let compiledContent = compiler(data);

            return new CAWebHTMLPlugin({
                template: page.template ?? page.file,
                filename: page.filename,
                title,
                templateParameters: {
                    scheme,
                    partial: compiledContent,
                },
            })
        }).filter( Boolean ) ,

        // Sitemap Generation
        ( ! flagExists('sitemap') || (flagExists('sitemap') && getArgVal('sitemap'))) && new SitemapWebpackPlugin.default({
            base: caweb?.site?.url || 'http://localhost:9000',
            paths: ['/build/', ...customPages.map( (page) => `/${page.filename}` )],
            options: {
                filename: 'sitemap.html',
                skipgzip: true, // By default, both .xml and .xml.gz are generated
                formatter: (config) => {
                    // we remove the build/ from the url since that is the output path and proxied
                    config = config.replace(/build\//g, '');
        
                    let parser = new XMLParser();
                    let xmlDoc = parser.parse(config, true);

                    // we map the urls to html links
                    let partial = xmlDoc.urlset.url ? 
                        xmlDoc.urlset.url.map( ({loc}) => `<a href="${loc}" class="d-block">${loc}</a>` ).join('') : '';

                    let content = fs.readFileSync( template ).toString();

                    let data = {
                        ...caweb.site,
                        scheme,
                        logo: '/media/logo.png',
                        partial: `<div class="container"><div class="row"><div class="col-12"><h2>Sitemap</h2>${partial}</div></div></div>`,
                    };

                    let compiler = Handlebars.compile( content );
                    let compiledContent = compiler(data);

                    return compiledContent;
                }
            }
        }),

        // Custom plugin to rename the sitemap file from sitemap.html.xml to sitemap.html since the sitemap-webpack-plugin does not allow us to set the extension to .html
        ( ! flagExists('sitemap') || (flagExists('sitemap') && getArgVal('sitemap'))) && {
            apply: (compiler) => {
                compiler.hooks.thisCompilation.tap('RenameSitemapWebpackPlugin',(compilation) => {
                    compilation.hooks.processAssets.tapAsync(
                        {
                            name: 'RenameSitemapWebpackPlugin',
                            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE ,
                        },
                        (assets, callback) => {
                            Object.keys(compilation.assets).forEach((assetName) => {
                                if (assetName.endsWith('.html.xml')) {
                                    const newName = assetName.replace('.xml', '');
                                    compilation.assets[newName] = compilation.assets[assetName];
                                    delete compilation.assets[assetName];
                                }
                            });
                            callback();
                        }
                    )
                    
                });
            },
        },

        // IBM Accessibility
        ( ! flagExists('a11y') || (flagExists('a11y') && getArgVal('a11y'))) && new CAWebA11yPlugin(),

        // WP CSS Auditor
        ( ! flagExists('audit') || (flagExists('audit') && getArgVal('audit'))) && new CAWebCSSAuditPlugin(),

        // JSHint
        ( ! flagExists('jshint') || (flagExists('jshint') && getArgVal('jshint'))) && new CAWebJSHintPlugin(),
        
    ].filter( Boolean ),
}