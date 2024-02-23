import { activateCAWeb, configureCAWeb } from "./caweb.js";
import { downloadSources } from "./download-sources.js";
import { configureDivi, isDiviThemeActive } from "./divi.js";
import { configureWordPress, isMultisite, convertToMultisite, generateHTAccess } from "./wordpress.js";
import { getTaxonomies, createTaxonomies }  from "./api.js";

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
    createTaxonomies
}