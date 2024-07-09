# caweb-cli
`caweb-cli` is a tool which rapidly sets up a local WordPress environment fully configured for the [CAWebPublishing Service](https://caweb.cdt.ca.gov/), allows for the creation of Gutenberg blocks with the CAWebPublishing template configurations, and much more. The cli will automatically generate the necessary [.wp-env.json](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/#wp-env-json) file, to override or add additional configuration options use the [.wp-env.override.json](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/#wp-env-override-json) file.

*`caweb-cli` is largely inspired by WordPress Packages major thanks to the whole WordPress team and community!*  

## Prerequisites
- Latest version of [Docker Desktop](https://www.docker.com/products/docker-desktop), which includes [Compose v2](https://docs.docker.com/compose/migrate/), is installed.
  - <strong>For Debian-Based Linux distributions:</strong> <code>docker-compose</code> may need to be installed with: <code>sudo apt-get install docker-compose</code>.
  - <strong>For Windows users:</strong> [WSL should be set to version 2 for Windows Docker Desktop compatibility](https://docs.docker.com/desktop/windows/wsl/).
- git is installed.

## Additional Features
- Downloads and configures the [CAWeb Theme](https://github.com/CAWebPublishing/CAWeb)
- Downloads approved plugins utilized by the CAWebPublishing Service  
- Downloads and configures the [Divi Theme](https://www.elegantthemes.com/gallery/divi/) and [Divi Builder Plugin](https://www.elegantthemes.com/gallery/divi/) (*requires valid ElegantThemes Username and API Key*)  
- Adds phpMyAdmin Service for both WordPress environments. (Username: <strong>root</strong> , Password: <strong>password</strong>)  
  - phpMyAdmin development site starts at http://localhost:8080  
  - phpMyAdmin test site started at http://localhost:9090
- Uses CAWebPublishing [External Project Template Configuration](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/packages-create-block-external-template/) when creating Gutenberg Blocks, see configurations [here](https://github.com/CAWebPublishing/cli/lib/template)
- Allows for syncing of WordPress instance via Rest API, to maintain ID's please ensure [CAWebPublishing Development Toolbox](https://github.com/CAWebPublishing/caweb-dev/) plugin is installed. 
- Allows for generation of  WordPress CSS Audits 
- Allows for IBM Accessibility Scan reports.
