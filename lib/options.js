/**
 * External dependencies
 */

const caweb_general_options = {
    CAWEB_TEMPLATE_VER: 'ca_site_version', // State Template Version
    CAWEB_NAV_MENU_STYLE: 'ca_default_navigation_menu', // Header Menu Type
    CAWEB_COLORSCHEME: 'ca_site_color_scheme', // Color Scheme
    CAWEB_TITLE_DISPLAY: 'ca_default_post_title_display', // Title Display Default
    CAWEB_STICKY_NAV: 'ca_sticky_navigation', // Sticky Navigation
    CAWEB_MENU_HOME_LINK: 'ca_home_nav_link', // Menu Home Link
    CAWEB_DISPLAY_POSTS_DATE: 'ca_default_post_date_display', // Display Date for Non-Divi Posts
    CAWEB_X_UA_COMPATIBILITY: 'ca_x_ua_compatibility', // Legacy Browser Support
    CAWEB_FRONTPAGE_SEARCH: 'ca_frontpage_search_enabled', // Show Search on Front Page
}

const CAWEB_OPTIONS = {
    ...caweb_general_options
}

module.exports = {
    CAWEB_OPTIONS
}