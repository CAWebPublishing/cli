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
import { config, env } from 'process';

const localFile = path.join(projectPath, 'package.json');
const pkg = JSON.parse( fs.readFileSync(localFile) );

const cawebJson = fs.existsSync( path.join(appPath, 'caweb.json') ) ? 
  JSON.parse(fs.readFileSync(path.join(appPath, 'caweb.json'))) 
  : {};

/**
 * Build .wp-env.json
 * 
 * @param {boolean} bare   True if excluding any CAWeb Configurations.
 * @param {boolean} multisite   True if converting to multisite.
 * @param {boolean} subdomain   True if converting to multisite subdomain.
 * @param {boolean} plugin   True if root directory is a plugin.
 * @param {boolean} theme   True if root directory is a theme.
 * 
 * @returns object
 */
function wpEnvConfig ( bare, multisite, subdomain, plugin, theme ) {
    let themes = [];
    let plugins = [];
    
    let envConfig = {
        core: `WordPress/WordPress#${pkg.config.WP_VER}`,
        phpVersion: `${pkg.config.PHP_VER}`,
        multisite,
        env: {
            development: { port: 8888, config: {} },
            tests: { port: 8889, config: {} }
        }
    }

    if( multisite && subdomain ){
        pkg.config.DEFAULTS.SUBDOMAIN_INSTALL= true;
    }

    envConfig.config = pkg.config.DEFAULTS

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
            envConfig.env.development.config['CAWEB_ORG_LOGO'] = `${envConfig.config['WP_SITEURL']}/` + path.join(
                uploadDir,
                path.basename(cawebJson.logo) + // add the port
                ('80' !== envConfig.env.development.port ? `:${envConfig.env.development.port}` : '')
            ).replace(/\\/g, '/');
                
            // tests configurations
            envConfig.env.tests.config['CAWEB_ORG_LOGO'] = `${envConfig.config['WP_SITEURL']}/` + path.join(
                uploadDir,
                path.basename(cawebJson.logo) + // add the port
                ('80' !== envConfig.env.tests.port ? `:${envConfig.env.tests.port}` : '')
            ).replace(/\\/g, '/');
        }

        // add caweb favicon
        if( cawebJson?.favicon ){
            // dev configurations
            envConfig.env.development.config['CAWEB_FAV_ICON'] = `${envConfig.config['WP_SITEURL']}/` + path.join(
                uploadDir,
                path.basename(cawebJson.favicon) + // add the port
                ('80' !== envConfig.env.development.port ? `:${envConfig.env.development.port}` : '')
            ).replace(/\\/g, '/');
                
            // tests configurations
            envConfig.env.tests.config['CAWEB_FAV_ICON'] = `${envConfig.config['WP_SITEURL']}/` + path.join(
                uploadDir,
                path.basename(cawebJson.favicon) + // add the port
                ('80' !== envConfig.env.tests.port ? `:${envConfig.env.tests.port}` : '')
            ).replace(/\\/g, '/');

        }

    }

    return envConfig;
    
}


/**
 * Build .wp-env.override.json
 * 
 * @param {boolean} bare   True if excluding any CAWeb Configurations.
 * @param {boolean} multisite   True if converting to multisite.
 * @param {boolean} subdomain   True if converting to multisite subdomain.
 * @param {boolean} plugin   True if root directory is a plugin.
 * @param {boolean} theme   True if root directory is a theme.
 * 
 * @returns object
 */
async function wpEnvOverrideConfig(){
    let divi = await promptForDivi();
     
    let config = {
        config: {
            ...divi
        }
    }

    return config;
}

export {
    wpEnvConfig,
    wpEnvOverrideConfig
}