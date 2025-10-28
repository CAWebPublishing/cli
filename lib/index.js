import {
    appPath,
    currentPath,
    projectPath,
    runCmd,
    runCLICmds,
    writeLine,
    writeError,
    clearLine,
    md5
} from './helpers.js';

// Spinner
import {
    withSpinner,
} from './spinner.js';

// WordPress
import {
    configureCAWeb,
	configureDivi,
	configureWordPress,
	getTaxonomies,
    createTaxonomies,
	CAWEB_OPTIONS,
	DIVI_OPTIONS
} from './wordpress/index.js';

export {
    appPath,
    currentPath,
    projectPath,
    writeLine,
    writeError,
    clearLine,
    md5,
    runCmd,
    withSpinner,
    runCLICmds,
    configureCAWeb,
	configureDivi,
	configureWordPress,
	getTaxonomies,
    createTaxonomies,
	CAWEB_OPTIONS,
	DIVI_OPTIONS
}