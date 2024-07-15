import {
    appPath,
    currentPath,
    projectPath,
    runCmd,
    runCLICmds
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