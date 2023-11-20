/**
 * External dependencies
 */
const path = require( 'path' );

const fs = require('fs-extra');

let default_wp_version = '6.3.1';
let default_php_version = '8.1';

/**
 * Build .wp-env.json
 * 
 * @param {boolean} options.bare   True if excluding any CAWeb Configurations.
 * @returns object
 */
const buildWPEnvConfig = ({bare}) => {
    let config = {
        core: `WordPress/WordPress#${default_wp_version}`,
        phpVersion: `${default_php_version}`,
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
        }
    }

    // if not bare then include our theme.
    if( ! bare ){
        config['themes'] = [`CA-CODE-Works/CAWeb`];
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
    let dockerConfig = {
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
      
    };

    let extraVolumes = [];

    // Divi theme to wordpress services volumes.
    if( fs.existsSync(path.join(workDirectoryPath, 'Divi')) ){
        extraVolumes = extraVolumes.concat(path.join(workDirectoryPath, 'Divi') + ':/var/www/html/wp-content/themes/Divi');
    }

    // Divi plugin to wordpress services volumes.
    if( fs.existsSync(path.join(workDirectoryPath, 'divi-builder')) ){
        extraVolumes = extraVolumes.concat(path.join(workDirectoryPath, 'divi-builder') + ':/var/www/html/wp-content/plugins/divi-builder');
    }

    // Add extra volumes to WordPress instances.
    if( extraVolumes.length ){

        dockerConfig.services.wordpress = {
            build: {
                context: '.',
                dockerfile: 'WordPress.Dockerfile'
            },
            volumes: extraVolumes,
        };
        dockerConfig.services.cli = {
            build: {
                context: '.',
                dockerfile: 'CLI.Dockerfile'
            },
            volumes: extraVolumes,
        };
        dockerConfig.services['tests-wordpress'] = {
            build: {
                context: '.',
                dockerfile: 'Tests-WordPress.Dockerfile'
            },
            volumes: extraVolumes,
        };
        dockerConfig.services['tests-cli'] = {
            build: {
                context: '.',
                dockerfile: 'Tests-CLI.Dockerfile'
            },
            volumes: extraVolumes,
        };
    }

    return dockerConfig;
}

module.exports = {
    buildWPEnvConfig,
    buildDockerComposeConfig
}