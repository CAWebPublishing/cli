v1.15.0
- Updated PHP version to 8.4
- Updated WordPress core to 6.9.0
- Updated npm packages

v1.14.11
- Updated npm packages

v1.14.10
- Updated npm packages

v1.14.9
- Fixed issue with external flag

v1.14.8
- Updated sync process and removed debug messages and fixed issues with flags not overwriting correctly
- Added no-external flag to the build command

v1.14.7 
- Fixed issue with shell command not working properly

v1.14.6
- Updated npm packages

v1.14.5
- Updated npm packages

v1.14.4
- Further cleaned up afterStart script
- Fixed issue with CAWeb Options not being set properly

v1.14.3
- bare flag removed, Divi is now installed if its not already installed.

v1.14.2
- .wp-env.json is now always generated.

v1.14.1
- Fixed issue with System Options not being found
- Updated npm packages

v1.14.0
- Added the @wordpress/env@10.33.0 md5 utility helpers since they were no longer being exported
- Removed download-sources file, resources are download via the .wp-env.json file now
- Removed update-plugins command
- Simplified startup by creating new afterStart Lifecycle Script

v1.13.7
- Updated npm packages

v1.13.6
- Fixed issue with CAWeb FavIcon and Org Logo not linking appropriately due to port being in wrong location

v1.13.5
- Updated npm packages

v1.13.4
- Updated npm packages

v1.13.3
- Updated spinner error handling, some Docker compose errors weren't displaying properly

v1.13.2
- Updated npm packages
- Removed WP_ENV_PHPMYADMIN_PORT and WP_ENV_TESTS_PHPMYADMIN_PORT config variables

v1.13.1
- Removed webpack npm plugins 

v1.13.0
- Updated WP Core to 6.8.2
- Updated npm packages

v1.12.4
- Added output-folder flag to audit command
- Updated npm packages

v1.12.3
- Updated spinner error handling so that thrown errors display the message without the stack trace

v1.12.2
- Removed bare flag from launch:sync script
- Initialized sync property if none exists

v1.12.1
- Updated Get Started directions
- create-site command will now create content/pages directory if it doesn't exist
- Fixed issue with exported name not found

v1.12.0
- Added new gen-scripts command which will added various scripts to the project
- Updated start command, removed our phpMyAdmin container since wp-env now provides it
- Update convert-site, create-site, and sync processes
- Added GetStarted documentation
- Added default sources to download-sources
- Added CAWEB_FAV_ICON environment variable to options.js which will update the CAWeb Options fav icon
- Added CAWEB_ORG_LOGO environment variable to options.js which will update the CAWeb Options organization logo
- docker compose override file no longer gets generated
- cli config.yml no longer gets generated
- Added default .htaccess for single site instances
- Application Password now gets generated whenever instance is updated
- Stop and Destroy command no longer needs to be overwritten
- shell and update-plugins commands moved to env directory

v1.11.2
- Updated commands readme.md
- createTaxonomies function now returns the collection
- Sync command now allows for syncing from static to local
- Added some validation during convert-site process
- CAWeb Card Module added to the generateModuleShortcodes function more to come

v1.11.1
- Fixed issue with build/serve command requesting wrong webpack.config.js file
- Added new create-site command which generates a caweb.json file bases on a series of questions
- Added new convert-site command will attempt to convert a site into shortcodes

v1.11.0
- Updated WP Core to 6.8.1

v1.10.12
- Updated npm packages 

v1.10.11
- Updated npm packages 

v1.10.10
- Updated npm packages 

v1.10.9
- Updated npm packages 

v1.10.8
- Updated npm packages 

v1.10.7
- Updated npm packages 

v1.10.6
- Added missing rimraf dependency

v1.10.5
- Updated npm packages 

v1.10.4
- Updated npm packages 

v1.10.3
- Updated npm packages 

v1.10.2
- Updated npm packages 

v1.10.1
- Corrected WordPress core version

v1.10.0
- Update WordPress core

v1.9.11
- Updated npm packages 

v1.9.10
- Updated npm packages 

v1.9.9
- Updated npm packages 

v1.9.8
- Updated npm packages 

v1.9.7
- Updated npm packages 

v1.9.6
- Updated npm packages 

v1.9.5
- Updated npm packages 

v1.9.4
- Updated npm packages 

v1.9.3
- Updated npm packages 

v1.9.2
- Updated npm packages 

v1.9.1
- Updated npm packages 

v1.9.0
- Update WordPress core
- Updated npm packages 

v1.8.14
- Updated npm packages 

v1.8.13
- Updated npm packages 

v1.8.12
- Updated npm packages 

v1.8.11
- Updated npm packages 

v1.8.10
- Updated npm packages 
- Added .allowExcessArguments(true) to all commands

v1.8.9
- Updated npm packages 

v1.8.8
- Updated npm packages 

v1.8.7
- Fixed issue with rimraf default export
- Updated npm packages

v1.8.6
- Updated npm packages

v1.8.5
- Updated npm packages

v1.8.4
- Updated npm packages

v1.8.3
- Updated npm packages

v1.8.2
- Updated WordPress core to 6.7.1

v1.8.1
- Fixed issue with WordPress core reference

v1.8.0
- Updated WordPress core to 6.7
- updated npm packages 
- Updated create block template npm dependencies version

v1.7.6
- Updated npm packages

v1.7.5
- Updated npm packages

v1.7.4
- Updated npm packages

v1.7.3
- Updated npm packages

v1.7.2
- Updated npm packages

v1.7.1
- Updated npm packages

v1.7.0
- Updated create-block template dependencies
- Updated npm packages
- Added missing npm packages
- Updated webpack build/serve commands

v1.6.29
- Updated npm packages

v1.6.28
- Updated npm packages

v1.6.27
- Updated npm packages

v1.6.26
- Removed auto download of Design System Plugin

v1.6.25
- Updated npm packages

v1.6.24
- Fixed issues with docker-compose declarations

v1.6.23
- Updated npm packages

v1.6.22
- Updated npm packages

v1.6.21
- Updated npm packages

v1.6.20
- Updated npm packages

v1.6.19
- Added false option to webpack serve
- webpack commands no longer using NODE_OPTIONS
- Updated npm packages

v1.6.18
- Updated npm packages

v1.6.17
- Updated npm packages

v1.6.16
- Updated npm packages

v1.6.15
- Updated WordPress core to 6.6.2

v1.6.14
- Fixed issue with webpack config in common js format 
- Updated npm packages

v1.6.13
- Updated npm packages

v1.6.12
- Updated npm packages
- Updated create-block npm dependencies

v1.6.11
- Removed debugging messages from sync process

v1.6.10
- Updated npm packages

v1.6.9
- Updated npm packages

v1.6.8
- Updated npm packages

v1.6.7
- Added missing dependencies

v1.6.6
- Updated php version for WP instances

v1.6.5
- Updated npm packages

v1.6.4
- Updated npm packages

v1.6.3
- Updated npm packages

v1.6.2
- Updated npm packages

v1.6.1
- Updated block template npm dependencies
- Updated npm packages

v1.6.0
- Removed version from docker-compose.override.yml the field is obsolete
- Updated npm packages

v1.5.11
- Added additional flags to serve command
- Update npm packages

v1.5.10
- Update npm packages

v1.5.9
- Added template flag to serve command

v1.5.8
- Update npm packages
- Added debug to sync process 

v1.5.7
- Updated WordPress to 6.6.1

v1.5.6
- Update npm packages
- Added CAWebPublishing Development plugin to download source

v1.5.5
- Updated WordPress to 6.6
- Added sync to default config
- Added descriptions to sync options
- Added additional messaging to interactive process

v1.5.4
- Update npm packages

v1.5.3
- Update npm packages

v1.5.2
- Update npm packages
- Added interactive mode for sync command
- create-block command now uses @inquirer/prompts instead of inquirer

v1.5.1
- Update npm packages
- Added Alias to Webpack build/start commands

v1.5.0
- All lib/webpack plugins have been moved to their respective packages
- Now using the @caweb/webpack package suite

v1.4.6
- Fixed issue with jshint reporter

v1.4.5
- Added missing npm package

v1.4.4
- Fixed issue with webpack file naming
- Added new commands reference sheet
- jshint and cli jshint command now use new @caweb/jshint-webpack-plugin class
- accessibility-checker and cli a11y command now use new @caweb/a11y-webpack-plugin class
- css-audit and cli audit command now use new @caweb/css-audit-webpack-plugin class

v1.4.3
- Submoduled WordPress/css-audit repo
- Added new audit command which runs WordPress CSS Audit tool
- Cleaned up build/serve commands
- Update Core WordPress version to 6.5.5
- Added --audit flag to serve command
- Added css-audit directory to webpack config static directories

v1.4.2
- Added hot flag to webpack serve command

v1.4.1
- Fixed self documentor script
- Fixed a11y checker

v1.4.0
- Update Core WordPress version to 6.5.4
- Update all npm package reference
- Updated serve command, site generator and webpack config process

v1.3.17
- Updated Core WordPress version to 6.5.3
- Updated npm package reference

v1.3.16
- Removed change-case dependency
- Update @wordpress/icons version for block template
- Fixed issue with render and viewScript in block template

v1.3.15
- Removed data-viz categories from block template
- Removed issue from .svg webpack rules
- Removed allowed_block_types filter

v1.3.14
- Webpack config updated to output.clean = true
- Updated create-block template

v1.3.13
- Added error handler to webpack build command
- Updated @wordpress/icons for create-block template
- Updated create-block run command parameters
- Updated update-block, process no longer destructively overwrites package.json or plugin.php header file
- Added @wordpress/create-block to npm packages list
- Added @wordpress/scripts to npm packages list

v1.3.12
- Added sanity check for media library
- Removed include param for menu items.

v1.3.11
- Commented out browserlist from webpack config 

v1.3.10
- Added extension to bin file for extensionless support 

v1.3.8
- Fixed issue when media is uploaded sometimes warnings will be included with the data. ( This occurs mostly if WP_DEBUG is true )
- Max execution time set to 300 seconds
- Added debug message to media library collection 

v1.3.7
- Updated permalink structure to /%year%/%monthnum%/%postname%/
- Added title and description to settings when syncing

v1.3.6
- Added filter when grabbing parentItems to remove any undefined objects

v1.3.5
- Resolved issue when include argument not passed during full sync

v1.3.4
- Removed ssh generation in cli config.yml 
- Added orderby argument to GET requests
- Refined sync process
- Any Media items src'd in page/post content are now sync'd
- Any parent page/posts are now sync'd

v1.3.3
- Removed timeout from requests
- Removed ssh, posts_per_page param from being added to every request
- Updated sync endpoint reference
- Removed wp-cli.phar
- Sync uses CAWebPublishing Development Plugin to maintain ID's
- Fixed issue with webpack publicPath not referencing correct path location 

v1.3.2
- Fixed issues with stderr mode being invalid
- Updated package dependencies
- Fixed issue with sync of menus
- Axios Error Handling now done by spinner

v1.3.0 
- Added more options to start command
- Added build, serve, a11y, sync commands
- Added wp-cli.phar build
- Added template for create-block command

v1.2.0 
- Added create-block command
- Added update-block command
- Added plugin/theme options to start command

v1.1.0
- Converted to ESM
- Upgraded Docker Compose from v1 to V2

v1.0.5
- Added config.yml to cli containers

v1.0.4
- Simplified codebase

v1.0.3
- Added Query Monitor plugin to plugin sources

v1.0.2
- Added new update-command
- Added Design System plugin to plugin sources
- CAWeb and Divi options are now configurable
- Permalink is configurable

v1.0.1
- Launches WordPress environments locally with wp-env
- Added phpMyAdmin services to Docker
- Added default WP configurations
