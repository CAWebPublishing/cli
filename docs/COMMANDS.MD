## Command Reference
### `caweb a11y`
Runs accessibility checks.
<pre>
<b>Usage:</b> caweb a11y [options] &lt;url&gt;

<b>Arguments:</b>
url                                URL to scan for accessibility checks.

<b>Options:</b>
--rule-archive &lt;rule&gt;              Specify the rule archive.
                                   Default: latest
--policies &lt;policy...&gt;             Specify one or many policies to scan.
                                   Default: WCAG_2_1
--fail-levels &lt;levels...&gt;          Specify one or many violation levels on which to fail the test.
                                   Default: violation,potentialviolation
--report-levels &lt;levels...&gt;        Specify one or many violation levels that should be reported.
                                   Default: violation,potentialviolation,recommendation,potentialrecommendation,manual,pass
--labels &lt;label...&gt;                Specify labels that you would like associated to your scan.
                                   Default: 
--output-format &lt;format&gt;           In which formats should the results be output.
                                   Default: html
--output-filename &lt;name&gt;           Filename for the scan results.
                                   Default: a11y
--output-folder &lt;folder&gt;           Where the scan results should be saved.
                                   Default: a11y
--output-filename-timestamp        Should the timestamp be included in the filename of the reports?
                                   Default: false
</pre>
### `caweb audit`
Runs WordPress CSS Audit tool against projects.
<pre>
<b>Usage:</b> caweb audit [options] [files...]

<b>Arguments:</b>
files                              Files or directory path to CSS files.
                                   Default: ./build

<b>Options:</b>
--format [format]                  Format to use for displaying report.
                                   Default: html
--filename [name]                  If using a format that outputs to a file, specify the file name.
                                   Default: css-audit
--output-folder [path]             Where the audit should be saved.
                                   Default: audits
--colors                           Runs colors audit.
                                   Default: true
--no-colors                        Skips colors audit.
--important                        Runs !important audit.
                                   Default: true
--no-important                     Skips !important audit.
--display-none                     Runs display: none audit.
                                   Default: true
--no-display-none                  Skips display: none audit.
--selectors                        Runs selectors audit.
                                   Default: true
--no-selectors                     Skips selectors audit.
--media-queries                    Runs media queries audit.
                                   Default: true
--no-media-queries                 Skips media queries audit.
--typography                       Runs typography audit.
                                   Default: true
--no-typography                    Skips typography audit.
--property-values &lt;values...&gt;      Runs property value audit.
                                   Default: font-size,padding,padding-top,padding-bottom,padding-right,padding-left,margin,margin-top,marin-bottom,marin-right,marin-left
--no-property-values               Skips property values audit.
</pre>
### `caweb build`
Builds the current project.
<pre>
<b>Usage:</b> caweb build [options]
</pre>
### `caweb clean`
Cleans the WordPress databases.
<pre>
<b>Usage:</b> caweb clean [options] [environment]

<b>Arguments:</b>
environment                        Which environment to use.
                                   Default: development
                                   Choices: development,tests,all

<b>Options:</b>
--scripts                          Execute any configured lifecycle scripts.
                                   Default: true
</pre>
### `caweb convert-site`
Attempts to convert a site.
<pre>
<b>Usage:</b> caweb convert-site [options]

<b>Options:</b>
--builder [builder]                Editor style to use for the pages.
                                   Default: wp
                                   Choices: plain,divi,gutenberg
</pre>
### `caweb create-block`
Scaffold for WordPress plugin to register Gutenberg Blocks.
<pre>
<b>Usage:</b> caweb create-block [options] &lt;slug&gt;

<b>Arguments:</b>
slug                               Plugin slug to use.
</pre>
### `caweb create-site`
Creates a new CAWebPublishing Site Configuration file.
<pre>
<b>Usage:</b> caweb create-site [options]

<b>Options:</b>
--site-title [title]               Site Title
                                   Default: cli
--silent,-s                        Runs the site creation process without prompts, this is useful for CI/CD pipelines.
                                   Default: false
</pre>
### `caweb destroy`
Deletes docker containers, volumes, and networks associated with the CAWebPublishing instances and removes local files.
<pre>
<b>Usage:</b> caweb destroy [options]

<b>Options:</b>
--scripts                          Execute any configured lifecycle scripts.
                                   Default: true
</pre>
### `caweb gen-scripts`
Adds some general basic scripts commonly used in most projects to your package.json.
<pre>
<b>Usage:</b> caweb gen-scripts [options]
</pre>
### `caweb install-path`
Get the path where all of the environment files are stored. This includes the Docker files, WordPress, PHPUnit files, and any sources that were downloaded.
<pre>
<b>Usage:</b> caweb install-path [options]
</pre>
### `caweb jshint`
Runs JSHint tool against projects.
<pre>
<b>Usage:</b> caweb jshint [options] [files...]

<b>Arguments:</b>
files                              Files or directory path to JS files.
                                   Default: ./src

<b>Options:</b>
--output-filename &lt;name&gt;           Filename for the scan results.
                                   Default: jshint
--output-folder &lt;folder&gt;           Where the hint results should be saved.
                                   Default: jshint
</pre>
### `caweb logs`
Displays PHP and Docker logs for given WordPress environment.
<pre>
<b>Usage:</b> caweb logs [options] [environment]

<b>Arguments:</b>
environment                        Which environment to use.
                                   Default: development
                                   Choices: development,tests,all

<b>Options:</b>
--no-watch                         Stops watching for logs in realtime.
                                   Default: true
</pre>
### `caweb run`
Runs an arbitrary command in one of the underlying Docker containers. A double dash can be used to pass arguments to the container without parsing them. This is necessary if you are using an option that is defined below. You can use `bash` to open a shell session and both `composer` and `phpunit` are available in all WordPress and CLI containers. WP-CLI is also available in the CLI containers.
<pre>
<b>Usage:</b> caweb run [options] &lt;container&gt; [command...]

<b>Arguments:</b>
container                          The underlying Docker service to run the command on.
                                   Default: development
                                   Choices: mysql,tests-mysql,wordpress,tests-wordpress,cli,tests-cli
command                            The command to run.

<b>Options:</b>
--env-cwd                          The command's working directory inside of the container. Paths without a leading slash are relative to the WordPress root.
                                   Default: .
</pre>
### `caweb serve`
Serves the current project using CAWebPublishing templates.
<pre>
<b>Usage:</b> caweb serve [options]

<b>Options:</b>
--template &lt;template&gt;              Serves the project using templating.
                                   Default: default
                                   Choices: default,blank
--scheme &lt;scheme&gt;                  Serves the project using template colorscheme.
                                   Default: oceanside
                                   Choices: delta,eureka,mono,oceanside,orangecounty,pasorobles,sacramento,santabarbara,santacruz,shasta,sierra,trinity,false
--no-audit                         Skips WordPress CSS-Audit.
                                   Default: false
--no-a11y                          Skips IBM Accessibility Checker.
                                   Default: false
--no-jshint                        Skips JSHint.
                                   Default: false
</pre>
### `caweb shell`
Open shell terminal in WordPress environment.
<pre>
<b>Usage:</b> caweb shell [options] [environment]

<b>Arguments:</b>
environment                        Which environment to use.
                                   Default: development
                                   Choices: development,tests,all
</pre>
### `caweb start`
Starts two CAWebPublishing WordPress instances  
development on port http://localhost:8888 (override with WP_ENV_PORT)  
tests on port http://localhost:8889 (override with WP_ENV_TESTS_PORT).
<pre>
<b>Usage:</b> caweb start [options]

<b>Options:</b>
--update                           Download source updates and apply WordPress configuration.
                                   Default: false
--xdebug &lt;mode&gt;                    Enables Xdebug. If not passed, Xdebug is turned off. If no modes are set, uses "debug". You may set multiple Xdebug modes by passing them in a comma-separated list: `--xdebug=develop,coverage`. See https://xdebug.org/docs/all_settings#mode for information about Xdebug modes.
--spx                              A simple profiling extension for PHP that provides low-overhead profiling with a built-in web UI.
                                   Default: 
--scripts                          Execute any configured lifecycle scripts.
                                   Default: true
--sync                             Will attempt to sync changes from a CAWebPublishing static site to this WordPress instance.
                                   Default: false
-p, --plugin                       True if root directory is a plugin.
                                   Default: false
-t, --theme                        True if root directory is a theme.
                                   Default: false
-m, --multisite                    True if converting to multisite.
                                   Default: false
--subdomain                        If passed, the network will use subdomains, instead of subdirectories. Doesn't work with 'localhost', make sure to set Port to 80.
                                   Default: false
</pre>
### `caweb stop`
Stops running WordPress for development and tests and frees the ports.
<pre>
<b>Usage:</b> caweb stop [options]
</pre>
### `caweb sync`
Sync changes from one WordPress instance to another.
<pre>
<b>Usage:</b> caweb sync [options] [target] [dest]

<b>Arguments:</b>
target                             Target Site URL, this is the site containing the latest changes.
dest                               Destination Site URL, this is the site where the latest changes should go.

<b>Options:</b>
--interactive                      Runs the sync process with prompts
-t,--tax &lt;tax...&gt;                  Taxonomy that should be synced. Default is full site sync.
                                   Default: media,menus,pages,posts,settings
                                   Choices: media,menus,pages,posts,settings
--media-ids &lt;ids...&gt;               Sync specific Media IDs.
--menu-ids &lt;ids...&gt;                Sync specific Menu IDs.
--page-ids &lt;ids...&gt;                Sync specific Page IDs.
--post-ids &lt;ids...&gt;                Sync specific Post IDs.
--debug                            Enable debug output.
                                   Default: false
</pre>
### `caweb update-block`
Updates a Gutenberg Block.
<pre>
<b>Usage:</b> caweb update-block [options] &lt;slug&gt;

<b>Arguments:</b>
slug                               Plugin slug to update.
</pre>