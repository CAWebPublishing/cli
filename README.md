# caweb-cli
`caweb-cli` lets you easily set up a local WordPress environment fully configured for the CAWebPublishing Service, to build and test plugins. using [wp-env](https://www.npmjs.com/package/@wordpress/env). 

## Additional Features
- phpMyAdmin Service  
- Downloads and configures the [CAWeb Theme](https://github.com/CA-cODE-Works/CAWeb)  
- Downloads and configures the [Divi Theme](https://www.elegantthemes.com/gallery/divi/) (*requires valid ElegantThemes Username and API Key*)
- SSH into the WordPress environments.

## Commands
**Note:** *All commands from wp-env are available, for more information on those commands [see](https://www.npmjs.com/package/@wordpress/env).*  

`caweb start` - Starts the CAWebPublishing WordPress Environment.  
`caweb ssh` - Open a terminal with an SSH connection to the WordPress environment.

## Environment Variables (.env, .env.local or .wp-env.override.json)
**Note:** *[.wp-env.override.json](https://www.npmjs.com/package/@wordpress/env#wp-envoverridejson) file takes precedence over .env file and is the preferred override method.*  

`LOCAL_PLUGIN_DIR` - Directory path of projects local plugins. Default: `wp-content/plugins`.  
`LOCAL_THEME_DIR` - Directory path of projects local themes. Default: `wp-content/themes`.  
`WP_VERSION` - The WordPress core version. Default: `6.3.1`.  
`PHP_VERSION` - The PHP version. Default: `8.1`.  
`ET_USERNAME` -  ElegantThemes Username.  
`ET_API_KEY` - ElegantThemes API Key.