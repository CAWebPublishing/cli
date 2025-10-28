/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';

/**
 * Internal Dependencies
 */
import {
    appPath,
    projectPath
} from '../lib/helpers.js';
import { promptForDivi } from './prompts.js';
import { CAWEB_OPTIONS, DIVI_OPTIONS } from'../lib/wordpress/options.js';
import { env } from 'process';

const localFile = path.join(projectPath, 'package.json');
const pkg = JSON.parse( fs.readFileSync(localFile) );

const cawebJson = fs.existsSync( path.join(appPath, 'caweb.json') ) ? 
  JSON.parse(fs.readFileSync(path.join(appPath, 'caweb.json'))) 
  : {};

/**
 * Build .wp-env.json
 * 
 * @param {boolean} multisite   True if converting to multisite.
 * @param {boolean} subdomain   True if converting to multisite subdomain.
 * @param {boolean} plugin   True if root directory is a plugin.
 * @param {boolean} theme   True if root directory is a theme.
 * 
 * @returns object
 */
async function wpEnvConfig ( {workDirectoryPath: cwd , multisite, subdomain, plugin, theme} ) {
    let themes = [];
    let plugins = [];
    let args = {cwd, multisite, subdomain, plugin, theme};
    let argString = Object.entries( args ).map( ([k, v]) => `--${k} ${v}` ).join( ' ' );

    let setupFile = path.join( projectPath, 'lib', 'wordpress', 'setup', 'index.js' );
    
    if( multisite && subdomain ){
        // if subdomain add the subdomain constant
        pkg.config.DEFAULTS.SUBDOMAIN_INSTALL= true;
    }

    let envConfig = {
        core: `WordPress/WordPress#${pkg.config.WP_VER}`,
        phpVersion: `${pkg.config.PHP_VER}`,
        multisite,
        themes: [ 
            `CAWebPublishing/CAWeb#${pkg.config.CAWEB_VER}` 
        ],
        plugins: [
            'CAWebPublishing/caweb-dev',
            `https://downloads.wordpress.org/plugin/query-monitor.${pkg.config.QUERY_MONITOR}.zip`,
        ],
        env: {
            development: { 
                port: 8888, 
                phpmyadminPort: 9998,
                config: {} 
        },
            tests: { 
                port: 8889, 
                phpmyadminPort: 9999,
                config: {} 
            }
        },
        lifecycleScripts: {
            afterStart: `node ${ setupFile } ${ argString }`,
        },
        config: {
            ...pkg.config.DEFAULTS
        }
    }

    if( multisite && subdomain ){
        // if subdomain add the subdomain constant
        envConfig.config.SUBDOMAIN_INSTALL= true;
    }

    // iterate over available CAWeb options.
	Object.entries(CAWEB_OPTIONS).forEach(([k,v]) => {
        envConfig.config[k] = v.defaultValue;
	})

    // iterate over available Divi options.
	Object.entries(DIVI_OPTIONS).forEach(([group, options]) => {
        // we dont want to set any automatic update options here.
        if( 'et_automatic_updates_options' === group ) return;

        // iterate over each group options.
		Object.entries(options).forEach(([key, data]) => {
            envConfig.config[key] = data.defaultValue;
        })
	})

    // if root directory is a theme
    if( theme ){
        themes.push( '.' );
    }
    
    // if root directory is a plugin
    if( plugin ){
        plugins.push( '.' );
    }

    // add plugins if sources were added
    if( plugins.length ){
        envConfig['plugins'] = plugins;
    }

    // add themes if sources were added
    if( themes.length ){
        envConfig['themes'] = themes;
    }

    // lets add some configurations from the caweb.json file
    if( cawebJson ){
        let siteDomain = new URL('http://localhost');
        let currentDate = new Date();
        let uploadDir = path.join(
                'wp-content', 'uploads',
                currentDate.getFullYear().toString(), (currentDate.getMonth() + 1).toString().padStart(2, '0')
            );


        // add siteurl and home
        if( cawebJson?.site?.domain ){
            siteDomain = new URL(cawebJson.site.domain);
            
            if( 'localhost' !== siteDomain.host ){
                // Global configurations
                envConfig.config['WP_SITEURL'] = `${cawebJson.site.domain}`;
                envConfig.config['WP_HOME'] = `${cawebJson.site.domain}`; 
                
                // dev configurations
                envConfig.env.development.port = '' !== siteDomain.port ? siteDomain.port : envConfig.env.development.port;

                // tests configurations
            }
        }

        // add caweb logo
        if( cawebJson?.logo ){
            // dev configurations
            envConfig.env.development.config['CAWEB_ORG_LOGO'] = `${envConfig.config['WP_SITEURL']}` + 
                ('80' !== envConfig.env.development.port ? `:${envConfig.env.development.port}/` : '/') +
                path.join( uploadDir, path.basename(cawebJson.logo) ).replace(/\\/g, '/');
                
            // tests configurations
            envConfig.env.tests.config['CAWEB_ORG_LOGO'] = `${envConfig.config['WP_SITEURL']}` + 
                ('80' !== envConfig.env.tests.port ? `:${envConfig.env.tests.port}/` : '/') +
                path.join( uploadDir, path.basename(cawebJson.logo) ).replace(/\\/g, '/');
        }

        // add caweb favicon
        if( cawebJson?.favicon ){
            // dev configurations
            envConfig.env.development.config['CAWEB_FAV_ICON'] = `${envConfig.config['WP_SITEURL']}` + 
                ('80' !== envConfig.env.development.port ? `:${envConfig.env.development.port}/` : '/') +
                path.join( uploadDir, path.basename(cawebJson.favicon) ).replace(/\\/g, '/');
                
            // tests configurations
            envConfig.env.tests.config['CAWEB_FAV_ICON'] = `${envConfig.config['WP_SITEURL']}` + 
                ('80' !== envConfig.env.tests.port ? `:${envConfig.env.tests.port}/` : '/') +
                path.join( uploadDir, path.basename(cawebJson.favicon) ).replace(/\\/g, '/');

        }

    }

    return envConfig;
    
}

/**
 * Build .wp-env.override.json
 * 
 * @param {boolean} multisite   True if converting to multisite.
 * @param {boolean} subdomain   True if converting to multisite subdomain.
 * @param {boolean} plugin   True if root directory is a plugin.
 * @param {boolean} theme   True if root directory is a theme.
 * 
 * @returns object
 */
async function wpEnvOverrideConfig({workDirectoryPath}){
    return {
        config: {
            ...await promptForDivi()
        }
    }
}

export {
    wpEnvConfig,
    wpEnvOverrideConfig
}