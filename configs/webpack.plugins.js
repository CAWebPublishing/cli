// this file is used to add any custom webpack plugins to the serve process.
/**
 * External dependencies
 */
import CAWebHTMLPlugin from "@caweb/html-webpack-plugin";
import CAWebA11yPlugin from '@caweb/a11y-webpack-plugin';
import CAWebCSSAuditPlugin from '@caweb/css-audit-webpack-plugin';
import CAWebJSHintPlugin from '@caweb/jshint-webpack-plugin';

import { flagExists } from '@caweb/webpack/lib/args.js';

export default {

    plugins: [
        // add custom plugins here
        // Used for Site Generation
        new CAWebHTMLPlugin(),

        // // IBM Accessibility
        ! flagExists('no-a11y') && new CAWebA11yPlugin(),

        // // WP CSS Auditor
        ! flagExists( 'no-audit' ) && new CAWebCSSAuditPlugin(),

        // // JSHint
        ! flagExists( 'no-jshint' ) && new CAWebJSHintPlugin(),
        
    ].filter( Boolean ),
}