import {
    appPath,
    currentPath,
    projectPath,
    runCmd,
    runCLICmds,
    writeLine,
    writeError,
    clearLine,
} from './helpers.js';

// Spinner
import {
    withSpinner,
} from './spinner.js';

// WordPress
import {
    activateCAWeb,
    configureCAWeb,
    downloadSources,
	configureDivi,
	isDiviThemeActive,
	configureWordPress,
	isMultisite,
	convertToMultisite,
	generateHTAccess,
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
    runCmd,
    withSpinner,
    runCLICmds,
    activateCAWeb,
    configureCAWeb,
    downloadSources,
	configureDivi,
	isDiviThemeActive,
	configureWordPress,
	isMultisite,
	convertToMultisite,
	generateHTAccess,
	getTaxonomies,
    createTaxonomies,
	CAWEB_OPTIONS,
	DIVI_OPTIONS
}