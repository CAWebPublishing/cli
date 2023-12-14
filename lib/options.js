/**
 * External dependencies
 */

/**
 * Missing options.
 * 
 * CAWEB_FAV_ICON
 * CAWEB_ORG_LOGO
 * Social Media Links
 * Custom CSS/JS
 * Alert Banners
 * Additional Features
 * 
 *  @todo Add missing options.
 */
const caweb_general_options = {
    CAWEB_TEMPLATE_VER: {
		name: 'ca_site_version',
		defaultValue: '5.5',
		label: 'State Template Version'
	},
    CAWEB_NAV_MENU_STYLE: {
		name: 'ca_default_navigation_menu',
		defaultValue: 'singlelevel',
		label: 'Header Menu Type'
	},
    CAWEB_COLORSCHEME: {
		name: 'ca_site_color_scheme',
		defaultValue: 'oceanside',
		label: 'Color Scheme'
	},
    CAWEB_TITLE_DISPLAY: {
		name: 'ca_default_post_title_display',
		defaultValue: false,
		label: 'Title Display Default'
	},
    CAWEB_STICKY_NAV: {
		name: 'ca_sticky_navigation',
		defaultValue: false,
		label: 'Sticky Navigation'
	},
    CAWEB_MENU_HOME_LINK: {
		name: 'ca_home_nav_link',
		defaultValue: false,
		label: 'Menu Home Link'
	},
    CAWEB_DISPLAY_POSTS_DATE: {
		name: 'ca_default_post_date_display',
		defaultValue: false,
		label: 'Display Date for Non-Divi Posts'
	},
    CAWEB_X_UA_COMPATIBILITY: {
		name: 'ca_x_ua_compatibility',
		defaultValue: false,
		label: 'Legacy Browser Support'
	},
    CAWEB_FRONTPAGE_SEARCH: {
		name: 'ca_frontpage_search_enabled',
		defaultValue: false,
		label: 'Show Search on Front Page'
	},
}

let utility_links = [];

for( let c = 1; c < 4; c++ ){
	utility_links[`CAWEB_UTILITY_LINK${c}_ENABLED`] = {
		name: `ca_utility_link_${c}_enable`,
		defaultValue: false,
		label: `Custom Link ${c}`	
	}
	utility_links[`CAWEB_UTILITY_LINK${c}_LABEL`] = {
		name: `ca_utility_link_${c}_name`,
		defaultValue: '',
		label: `Custom Link ${c} Label`		
	}
	utility_links[`CAWEB_UTILITY_LINK${c}_URL`] = {
		name: `ca_utility_link_${c}`,
		defaultValue: '',
		label: `Custom Link ${c} URL`		
	}
	utility_links[`CAWEB_UTILITY_LINK${c}_NEW_WINDOW`] = {
		name: `ca_utility_link_${c}_new_window`,
		defaultValue: false,
		label: `Custom Link ${c} Open in New Tab`		
	}
}

const caweb_utility_header_options = {
	CAWEB_CONTACT_US_PAGE : {
		name: 'ca_contact_us_link',
		defaultValue: '',
		label: 'Contact Us Page'
	},
	CAWEB_GEO_LOCATOR : {
		name: 'ca_geo_locator_enabled',
		defaultValue: false,
		label: 'Enable Geo Locator'
	},
	CAWEB_UTILITY_HOME_LINK : {
		name: 'ca_utility_home_icon',
		defaultValue: false,
		label: 'Home Link'
	},
	...utility_links
};

const page_header_options = {
	CAWEB_CAWEB_ORG_LOGO_ALT_TEXT: {
		name: '',
		defaultValue: '',
		label: 'Organization Logo-Alt Text'
	}
};

const google_options = {
	CAWEB_GOOGLE_SEARCH_ENGINE_ID : {
		name: 'ca_google_search_id',
		defaultValue: '',
		label: 'Search Engine ID'
	},
	CAWEB_GOOGLE_ANALYTICS_ID: {
		name: 'ca_google_analytic_id',
		defaultValue: '',
		label: 'Analytics ID'
	},
	CAWEB_GOOGLE_ANALYTICS4_ID: {
		name: 'ca_google_analytic4_id',
		defaultValue: '',
		label: 'Analytics 4 ID'
	},
	CAWEB_GOOGLE_TAG_MANAGER_ID: {
		name: 'ca_google_tag_manager_id',
		defaultValue: '',
		label: 'Tag Manager ID'
	},
	CAWEB_GOOGLE_META_ID: {
		name: 'ca_google_meta_id',
		defaultValue: '',
		label: 'Site Verification Meta ID'
	},
	CAWEB_GOOGLE_TRANSLATE_MODE: {
		name: 'ca_google_trans_enabled',
		defaultValue: 'none',
		label: 'Enable Google Translate'
	},
	CAWEB_GOOGLE_TRANSLATE_PAGE: {
		name: 'ca_google_trans_page',
		defaultValue: '',
		label: 'Translate Page'
	},
	CAWEB_GOOGLE_TRANSLATE_PAGE_NEW_WINDOW: {
		name: 'ca_google_trans_page_new_window',
		defaultValue: true,
		label: 'Open in New Tab'
	},
	CAWEB_GOOGLE_TRANSLATE_ICON: {
		name: 'ca_google_trans_icon',
		defaultValue: 'globe',
		label: 'Icon'
	}
};

const github_options = {
	CAWEB_PRIVATE_REPO: {
		name: 'caweb_private_theme_enabled',
		defaultValue: false,
		label: 'Is Private?'
	},
	CAWEB_GIT_USER: {
		name: 'caweb_username',
		defaultValue: 'CA-CODE-Works',
		label: 'Username'
	},
	CAWEB_ACCESS_TOKEN: {
		name: 'caweb_password',
		defaultValue: '',
		label: 'Token'
	}
};

const CAWEB_OPTIONS = {
    ...caweb_general_options,
	...caweb_utility_header_options,
	...page_header_options,
	...google_options,
	...github_options
}

const DIVI_OPTIONS = {
	'et_divi': {
		ET_DYNAMIC_MODULE: {
			name: 'divi_dynamic_module_framework',
			defaultValue: 'on',
			label: 'Dynamic Module Framework'
		},
		ET_DYNAMIC_CSS: {
			name: 'divi_dynamic_css',
			defaultValue: 'on',
			label: 'Dynamic CSS'
		},
		ET_CRITICAL_CSS: {
			name: 'divi_critical_css',
			defaultValue: 'on',
			label: 'Critical CSS'
		},
		ET_DYNAMIC_JS: {
			name: 'divi_dynamic_js_libraries',
			defaultValue: 'on',
			label: 'Dynamic JavaScript Libraries'
		},
		ET_CLASSIC_EDITOR: {
			name: 'et_enable_classic_editor',
			defaultValue: 'on',
			label: 'Enable Classic Editor'
		},
		ET_STATIC_CSS_GENERATION: {
			name: 'et_pb_static_css_file',
			defaultValue: 'on',
			label: 'Static CSS File Generation'
		},
		ET_PRODUCT_TOUR: {
			name: 'et_pb_product_tour_global',
			defaultValue: 'off',
			label: 'Product Tour'
		}
	},
	'et_bfb_settings': {
			ET_NEW_BUILDER_EXPERIENCE: {
				name: 'enable_bfb',
				defaultValue: 'off',
				label: 'Enable The Latest Divi Builder Experience'
			},
			ET_OUTPUT_STYLES_INLINE: {
				name: 'et_pb_css_in_footer',
				defaultValue: 'off',
				label: 'Output Styles Inline'
			}
	},
	'et_automatic_updates_options':  {
		ET_USERNAME: {
			name: 'username',
			defaultValue: '',
			label: 'Username'
		},
		ET_API_KEY: {
			name: 'api_key',
			defaultValue: '',
			label: 'API Key'
		}
	
	}
}

module.exports = {
    CAWEB_OPTIONS,
	DIVI_OPTIONS
}