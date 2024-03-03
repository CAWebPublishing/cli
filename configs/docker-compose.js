/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import getHostUser from '@wordpress/env/lib/get-host-user.js';
import yaml from 'js-yaml';
import os from 'os';

/**
 * Internal Dependencies
 */

/**
 * Generate config.yml
 * 
 * @param {string}  workDirectoryPath Path to the work directory located in ~/.wp-env.
 * 
 * @returns void
 */
async function generateCLIConfig(workDirectoryPath){
    let yml = {
        path: '/var/www/html',
        apache_modules: ['mod_rewrite']
    };
    
    fs.writeFileSync(
        path.join(workDirectoryPath, 'config.yml'),
        yaml.dump(yml));
}

/**
 * Build docker-compose.override.yml
 * 
 * @param {string}  workDirectoryPath Path to the work directory located in ~/.wp-env.
 * @returns object
 */
export default function dockerConfig ( workDirectoryPath ) {
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