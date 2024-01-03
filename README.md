# caweb-cli
`caweb-cli` rapidly sets up a local WordPress environment, fully configured for the [CAWebPublishing Service](https://caweb.cdt.ca.gov/). The cli will automatically generate the necessary [.wp-env.json](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/#wp-env-json) file, to override or add additional configuration options use the [.wp-env.override.json](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/#wp-env-override-json) file.

*`caweb-cli` is largely inspired by [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) major thanks to the whole WordPress team and community!*

## Additional Features
- Downloads and configures the [CAWeb Theme](https://github.com/CAWebPublishing/CAWeb)  
- Downloads and configures the [Divi Theme](https://www.elegantthemes.com/gallery/divi/) (*requires valid ElegantThemes Username and API Key*)  
- Adds phpMyAdmin Service for both WordPress environments. (Username: <strong>bold</strong> , Password: <strong>password</strong>)  
-- phpMyAdmin development site starts at http://localhost:8080  
-- phpMyAdmin test site started at http://localhost:9090

- Adds config.yml to both cli containers 
<pre>
path: /var/www/html
apache_modules:
  - mod_rewrite
</pre>

- [External Project Template Configuration](https://github.com/CAWebPublishing/cli/lib/template)  

## Command Reference
### `caweb start`  
Generates the required wp-env.json, starts the WordPress environment, downloads any CAWebPublishing sources and approved plugins.  
<pre>
caweb start

Options:
      --debug      Enable debug output.               [boolean] [default: false]
      --update     Download source updates and apply WordPress configuration.
                                                      [boolean] [default: false]
      --xdebug     Enables Xdebug. If not passed, Xdebug is turned off. If no
                   modes are set, uses "debug". You may set multiple Xdebug
                   modes by passing them in a comma-separated list:
                   `--xdebug=develop,coverage`. See
                   https://xdebug.org/docs/all_settings#mode for information
                   about Xdebug modes.                                  [string]
      --scripts    Execute any configured lifecycle scripts.
                                                       [boolean] [default: true]
      --bare       True if excluding any downloads from CAWeb, use this if you
                   want to use a local version of the CAWeb Theme,
                   Configurations will still be applied.
                                                      [boolean] [default: false]
  -m, --multisite  True if converting to multisite.   [boolean] [default: false]
      --subdomain  If passed, the network will use subdomains, instead of
                   subdirectories. Doesn't work with 'localhost', make sure to
                   set Port to 80.                    [boolean] [default: false]
</pre>
### `caweb stop`  
<pre>
caweb stop

Stops running WordPress for development and tests and frees the ports.

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
</pre>
### `caweb clean [environment]`  
<pre>
caweb clean [environment]

Cleans the WordPress databases.

Positionals:
  environment  Which environments' databases to clean.
            [string] [choices: "all", "development", "tests"] [default: "tests"]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --scripts  Execute any configured lifecycle scripts. [boolean] [default: true]
</pre>
### `caweb run <container> [command...]`  
<pre>
caweb run <container> [command...]

Runs an arbitrary command in one of the underlying Docker containers. A double
dash can be used to pass arguments to the container without parsing them. This
is necessary if you are using an option that is defined below. You can use
`bash` to open a shell session and both `composer` and `phpunit` are available
in all WordPress and CLI containers. WP-CLI is also available in the CLI
containers.

Positionals:
  container  The underlying Docker service to run the command on.
              [string] [required] [choices: "mysql", "tests-mysql", "wordpress",
                                          "tests-wordpress", "cli", "tests-cli"]
  command    The command to run.                           [array] [default: []]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --env-cwd  The command's working directory inside of the container. Paths
             without a leading slash are relative to the WordPress root.
                                                         [string] [default: "."]
</pre>
### `caweb destroy`  
<pre>
caweb destroy

Destroy the WordPress environment. Deletes docker containers, volumes, and
networks associated with the WordPress environment and removes local files.

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --scripts  Execute any configured lifecycle scripts. [boolean] [default: true]
</pre>
### `caweb logs [environment]`  
<pre>
caweb logs [environment]

displays PHP and Docker logs for given WordPress environment.

Positionals:
  environment  Which environment to display the logs from.
      [string] [choices: "development", "tests", "all"] [default: "development"]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --watch    Watch for logs as they happen.            [boolean] [default: true]
</pre>
### `caweb install-path`  
<pre>
caweb install-path

Get the path where all of the environment files are stored. This includes the
Docker files, WordPress, PHPUnit files, and any sources that were downloaded.

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
</pre>
### `caweb shell [environment]`  
<pre>
caweb shell [environment]

Open shell terminal in WordPress environment.

Positionals:
  environment  Which environment to open terminal in.
             [string] [choices: "development", "tests"] [default: "development"]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
</pre>
### `caweb update-plugins [environment]`  
<pre>
caweb update-plugins [environment]

Updates all plugins in the WordPress environment.

Positionals:
  environment  Which environment to update.
             [string] [choices: "development", "tests"] [default: "development"]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
</pre>
