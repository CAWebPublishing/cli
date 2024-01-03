/**
 * External dependencies
 */
import path from 'node:path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import getHostUser from '@wordpress/env/lib/get-host-user.js';

/**
 * Promisified dependencies
 */
const { writeFile } = fs.promises;

const localPath = path.resolve( path.join(process.cwd(), 'node_modules/@caweb/cli/package.json') )
const pkg = JSON.parse( await fs.readFile(localPath) );

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
const buildWPEnvConfig = (bare, multisite, plugin, theme) => {
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

/**
 * Build docker-compose.override.yml
 * 
 * @param {string}  workDirectoryPath Path to the work directory located in ~/.wp-env.
 * @returns object
 */
const buildDockerComposeConfig = (workDirectoryPath) => {
	const {name} = getHostUser();
    
    // generate cli config file for cli containers.
    generateCLIConfig(workDirectoryPath);

    let dockerConfig = {
        version: '3.7',
        services: {
            phpmyadmin: {
                image: `phpmyadmin:latest`,
                restart: 'always',
                ports: ['8080:80'],
                environment: {
                    PMA_HOSTS : 'mysql,tests-mysql',
                    UPLOAD_LIMIT: '3G',
                    MEMORY_LIMIT: '5G',
                    MAX_EXECUTION_TIME: 7200
                }
            },
            cli: {
                build: {
                    context: '.',
                    dockerfile: 'CLI.Dockerfile'
                },
                volumes: [ path.join(workDirectoryPath, 'config.yml')  + `:/home/${name}/.wp-cli/config.yml`  ]
            },
            "tests-cli": {
                build: {
                    context: '.',
                    dockerfile: 'Tests-CLI.Dockerfile'
                },
                volumes: [ path.join(workDirectoryPath, 'config.yml')  + `:/home/${name}/.wp-cli/config.yml`]
            },
            wordpress: {
                build: {
                    context: '.',
                    dockerfile: 'WordPress.Dockerfile'
                }
            },
            "tests-wordpress": {
                build: {
                    context: '.',
                    dockerfile: 'Tests-WordPress.Dockerfile'
                }
            }
        }
      
    };

    let extraVolumes = [];

    // Add downloaded themes to services volumes.
    if( fs.existsSync(path.join(workDirectoryPath, 'themes')) ){
        extraVolumes = extraVolumes.concat(path.join(workDirectoryPath, 'themes') + ':/var/www/html/wp-content/themes');
    }

    // Add downloaded plugins to services volumes.
    if( fs.existsSync(path.join(workDirectoryPath, 'plugins')) ){
        extraVolumes = extraVolumes.concat(path.join(workDirectoryPath, 'plugins') + ':/var/www/html/wp-content/plugins');
    }

    // Add extra volumes to WordPress instances.
    if( extraVolumes.length ){
        dockerConfig.services.wordpress = {
            ...dockerConfig.services.wordpress,
            volumes: [
                ...extraVolumes
            ],
        };
        dockerConfig.services.cli = {
            ...dockerConfig.services.cli,
            volumes: [
                ...dockerConfig.services.cli.volumes,
                ...extraVolumes
            ],
        };
        dockerConfig.services['tests-wordpress'] = {
            ...dockerConfig.services['tests-wordpress'],
            volumes: [
                ...extraVolumes
            ],
        };
        dockerConfig.services['tests-cli'] = {
            ...dockerConfig.services['tests-cli'],
            volumes: [
                ...dockerConfig.services['tests-cli'].volumes,
                ...extraVolumes
            ],
        };

    }

    return dockerConfig;
}

/**
 * Generate config.yml
 * 
 * @param {string}  workDirectoryPath Path to the work directory located in ~/.wp-env.
 * 
 * @returns void
 */
async function generateCLIConfig(workDirectoryPath){
    const yml = {
        path: '/var/www/html',
        apache_modules: ['mod_rewrite']
    };

    await writeFile(
        path.join(workDirectoryPath, 'config.yml'),
        yaml.dump(yml));
}

export {
    buildWPEnvConfig,
    buildDockerComposeConfig
}