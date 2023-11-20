# caweb-cli
`caweb-cli` rapidly sets up a local WordPress environment using [wp-env](https://www.npmjs.com/package/@wordpress/env), fully configured to the [CAWebPublishing Service](https://caweb.cdt.ca.gov/). The cli will automatically generate the necessary [.wp-env.json](https://www.npmjs.com/package/@wordpress/env#wp-envjson) file, to override or add additional configuration options use the [.wp-env.override.json](https://www.npmjs.com/package/@wordpress/env#wp-envoverridejson) file.

## Additional Features
- phpMyAdmin Service  
- Downloads and configures the [CAWeb Theme](https://github.com/CA-cODE-Works/CAWeb)  
- Downloads and configures the [Divi Theme](https://www.elegantthemes.com/gallery/divi/) (*requires valid ElegantThemes Username and API Key*)

## Command Reference
`caweb-cli` is a wrapper for [wp-env](https://www.npmjs.com/package/@wordpress/env); therefore, all commands from wp-env are readily available, for more information on those commands [see](https://www.npmjs.com/package/@wordpress/env#command-referenced). ***Note:** substitute `wp-env` command with `caweb`. 

### `caweb start`  
Starts the CAWebPublishing WordPress Environment.  
### `caweb ssh`  
Open a shell session in the WordPress environment.

## [.wp-env.override.json](https://www.npmjs.com/)  
Any fields here will take precedence over .wp-env.json. 
#### <ins>Special Config Values</ins>
`ET_USERNAME` -  ElegantThemes Username.  
`ET_API_KEY` - ElegantThemes API Key.