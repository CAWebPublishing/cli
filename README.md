# caweb-cli
`caweb-cli` lets you easily set up a local CAWebPublishing WordPress environment for building and testing plugins and themes using [wp-env](https://www.npmjs.com/package/@wordpress/env). 

## Commands
**Note:** *All commands from wp-env are available, for more information [see](https://www.npmjs.com/package/@wordpress/env).*  

`caweb init` - Generates the .wp-env.json and docker-compose.override.yml file used and downloads CAWeb Plugins and Theme repositories.

`caweb start` - Starts the CAWebPublishing WordPress Environment.  

## Environment Variables (.env)
**Note:** *[.wp-env.override.json](https://www.npmjs.com/package/@wordpress/env#wp-envoverridejson) file takes precedence over .env file and is the preferred override method.*  

`LOCAL_PLUGIN_DIR` - Directory path of projects local plugins. Default: `wp-content/plugins`.  
`LOCAL_THEME_DIR` - Directory path of projects local themes. Default: `wp-content/themes`.  
`WP_VERSION` - The WordPress core version. Default: `6.3.1`.  
`PHP_VERSION` - The PHP version. Default: `8.1`.  