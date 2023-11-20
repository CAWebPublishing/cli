/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require('fs-extra');
const pkg = require( '../package.json' );


/**
 * Build .wp-env.json
 * 
 * @param {boolean} options.bare   True if excluding any CAWeb Configurations.
 * @returns object
 */
const buildWPEnvConfig = ({bare}) => {
    let config = {
        core: `WordPress/WordPress#${pkg.config.WP_VER}`,
        phpVersion: `${pkg.config.PHP_VER}`,
        config: {
            ...pkg.config.DEFAULTS
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