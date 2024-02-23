import {
    wpPrimary,
    wpGreen,
    wpRed,
    wpYellow,
    withSpinner,
} from './spinner.js';

import {
	runCmd,
    runCLICmds,
	currentPath,
    projectPath,
    appPath
} from './helpers.js';

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
    createTaxonomies
} from './wordpress/index.js';

export {
    currentPath,
    projectPath,
    appPath,
    wpPrimary,
    wpGreen,
    wpRed,
    wpYellow,
    withSpinner,
	runCmd,
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
    createTaxonomies
}