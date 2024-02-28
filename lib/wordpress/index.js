import { activateCAWeb, configureCAWeb } from "./caweb.js";
import { downloadSources } from "./download-sources.js";
import { configureDivi, isDiviThemeActive } from "./divi.js";
import { configureWordPress, isMultisite, convertToMultisite, generateHTAccess } from "./wordpress.js";
import { getTaxonomies, createTaxonomies }  from "./api.js";
import { CAWEB_OPTIONS, DIVI_OPTIONS } from './options.js';

export {
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