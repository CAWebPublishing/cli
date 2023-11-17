/**
 * External dependencies
 */
const path = require( 'path' );

const fs = require('fs-extra');

require('dotenv').config()
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

let default_wp_version = '6.3.1';
let default_php_version = '8.1';

let plugin_dir = undefined !== process.env.LOCAL_PLUGIN_DIR ? 
                process.env.LOCAL_PLUGIN_DIR : 
                './wp-content/plugins';
let theme_dir = undefined !== process.env.LOCAL_THEME_DIR ? 
                process.env.LOCAL_THEME_DIR : 
                './wp-content/themes';

/**
 * Add Mappings to .wp-env.json
 * 
 * @returns object
 */
function buildWPEnvMappings(){
    let map = {};

    // add local plugin mapping if not blank.
    if( 0 !== plugin_dir.length ){
        // ensure directory exists.
        //fs.ensureDir(path.join(process.cwd(), plugin_dir));

        map = {
            mappings: {
                ...map.mappings,
                "wp-content/plugins" : `${plugin_dir}`
            }
        }
    }

    // add local theme mapping if not blank.
    if( 0 !== theme_dir.length ){
        //fs.ensureDir(path.join(process.cwd(), theme_dir));
        map = {
            mappings: {
                ...map.mappings,
                "wp-content/themes" : `${theme_dir}`
            }
        }
    }

    return map;
}

/**
 * Build .wp-env.json
 * 
 * @returns object
 */
const buildWPEnvConfig = () => {
    let wpConstants = {};

    // iterate over environment variables
    Object.entries(process.env).forEach(([k,v]) => {
        // correct boolean values.
        v = 'true' === v ? true : v;
        v = 'false' === v ? false : v;

        // save any WordPress prefixed variables. 
        if( `${k}`.startsWith('WP_') ){
            wpConstants[`${k}`] = v;
        }

        // save any ElegantThemes prefixed variables. 
        if( `${k}`.startsWith('ET_') ){
            wpConstants[`${k}`] = v;
        }
    });

    // overwrite WordPress version if .env variable exists.
    if( undefined !== process.env.WP_VERSION  ){
        default_wp_version = process.env.WP_VERSION;
    }

    // overwrite PHP version if .env variable exists.
    if( undefined !== process.env.PHP_VERSION  ){
        default_php_version = process.env.PHP_VERSION;
    }

    return {
        core: `WordPress/WordPress#${default_wp_version}`,
        phpVersion: `${default_php_version}`,
        themes: [`${theme_dir}/CAWeb`],
        config: {
            WP_DEFAULT_THEME: 'CAWeb',
            FS_METHOD: 'direct',
            WP_ALLOW_MULTISITE: true,
            WP_DEBUG: true,
            WP_DEBUG_LOG: true,
            WP_DEBUG_DISPLAY: false,
            ADMIN_COOKIE_PATH: '/',
            COOKIE_DOMAIN: '',
            COOKIEPATH: '',
            SITECOOKIEPATH: '',
            ...wpConstants
        },
        ...buildWPEnvMappings()
    }
    
}

/**
 * Build docker-compose.override.yml
 * 
 * @returns object
 */
const buildDockerComposeConfig = () => {
    return {
        version: '3.7',
        services: {
            phpmyadmin: {
                image: `phpmyadmin:latest`,
                restart: 'always',
                ports: ['8080:80'],
                environment: {
                    PMA_HOST : 'mysql',
                    UPLOAD_LIMIT: '3G',
                    MEMORY_LIMIT: '5G',
                    MAX_EXECUTION_TIME: 7200
                }
            },
            "tests-phpmyadmin": {
                image: `phpmyadmin:latest`,
                restart: 'always',
                ports: ['9090:80'],
                environment: {
                    PMA_HOST : 'tests-mysql',
                    UPLOAD_LIMIT: '3G',
                    MEMORY_LIMIT: '5G',
                    MAX_EXECUTION_TIME: 7200
                }
            }
        }
      
    }
}

module.exports = {
    plugin_dir,
    theme_dir,
    buildWPEnvConfig,
    buildDockerComposeConfig
}