/**
 * External dependencies
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

const CAWEB_OPTIONS = {
    ...caweb_general_options
}

module.exports = {
    CAWEB_OPTIONS
}