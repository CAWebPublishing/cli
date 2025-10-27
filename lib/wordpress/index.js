import { isCAWebActive, configureCAWeb } from "./setup/caweb.js";
import { configureDivi } from "./setup/divi.js";
import { 
	configureWordPress
} from "./wordpress.js";
import { getTaxonomies, createTaxonomies }  from "./api.js";
import { CAWEB_OPTIONS, DIVI_OPTIONS } from './options.js';

export {
	isCAWebActive,
    configureCAWeb,
	configureDivi,
	configureWordPress,
	getTaxonomies,
    createTaxonomies,
	CAWEB_OPTIONS,
	DIVI_OPTIONS
}