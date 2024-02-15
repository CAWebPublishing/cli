/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';

/**
 * Internal Dependencies
 */
import {
    projectPath
} from '../lib/helpers.js';

const localFile = path.join(projectPath, 'package.json');
const pkg = JSON.parse( fs.readFileSync(localFile) );

/**
 * Build .wp-env.json
 * 
 * @param {boolean} bare   True if excluding any CAWeb Configurations.
 * @param {boolean} multisite   True if converting to multisite.
 * @param {boolean} plugin   True if root directory is a plugin.
 * @param {boolean} theme   True if root directory is a theme.
 * 
 * @returns object
 */
export default function wpEnvConfig ( bare, multisite, plugin, theme ) {
    let themes = [];
    let plugins = [];

    let config = {
        core: `WordPress/WordPress#${pkg.config.WP_VER}`,
        phpVersion: `${pkg.config.PHP_VER}`,
        config: {
            ...pkg.config.DEFAULTS
        }
    }

    // if not bare then include our theme.
    if( ! bare ){
        themes.push('CAWebPublishing/CAWeb')
    }

    // if root directory is a theme
    if( theme ){
        themes.push( '.' );
    }
    
    // if is multisite
    if( multisite ){
        config.config['WP_ALLOW_MULTISITE'] = true;

        // set CAWeb as Default Theme if it was downloaded
        if( ! bare ){
            config.config['WP_DEFAULT_THEME'] = 'CAWeb';
        }
    }

    // if root directory is a plugin
    if( plugin ){
        plugins.push( '.' );
    }

    // add plugins if sources were added
    if( plugins.length ){
        config['plugins'] = plugins;
    }

    // add themes if sources were added
    if( themes.length ){
        config['themes'] = themes;
    }

    return config;
    
}