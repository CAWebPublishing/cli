/**
 * WebPack Configuration for California Department of Technology
 * 
 * Utilizes WordPress Scripts Webpack configuration as base.
 * s 
 * @link https://webpack.js.org/configuration/
 */

/**
 * External dependencies
 */
import baseConfig from '@wordpress/scripts/config/webpack.config.js';
import MiniCssExtractPlugin from "mini-css-extract-plugin";

/**
 * Internal dependencies
 */
import SiteGenerator from '../gen/site-generator.js';

// fallback to env variable
let isProduction = "production" === process.env.NODE_ENV;

// because we use WordPress default WebPack config 
// 'mode' is defined by process.env.NODE_ENV
// some of the webpack cli flags are ignored
// so let's make some corrections.
let corrections = {};

process.argv.splice( 2 ).forEach(element => {
    // if flag
    if( element.startsWith( '--' ) ){
      let splitterIndex = element.indexOf( '=' );
      let flag = element.substring(2, splitterIndex );
      let value = element.substring( splitterIndex + 1 );

      // if flag is a webpack flag add corrections.
      switch( flag ){
        case 'mode':
          // if cli arg was passed use that value
          isProduction = "production" === value;

          corrections[flag] = value
          break
      }
      
    }
   
});


// update the WordPress default webpack rules with ours.
baseConfig.module.rules.forEach((rule, i) => {
  const r = new RegExp(rule.test).toString();

  // WordPress adds a hash to asset file names we remove that hash
  if( r === new RegExp(/\.(bmp|png|jpe?g|gif|webp)$/i).toString() ){
    baseConfig.module.rules[i].generator = {
      filename: 'images/[name][ext]'
    }
  }
  if( r  === new RegExp(/\.(woff|woff2|eot|ttf|otf)$/i).toString() ){
    baseConfig.module.rules[i].generator = {
      filename: 'fonts/[name][ext]'
    }
  }
  // SVG rules
  if( r  === new RegExp(/\.svg$/).toString()  ){
        // we don't want SVG to be inline move them to fonts folder
        if( 'asset/inline' === rule.type ){
          baseConfig.module.rules[i].type = 'asset/resource';
          baseConfig.module.rules[i].generator = {
            filename: 'fonts/[name][ext]'
          };

          // we don't care who the issuer is
          delete baseConfig.module.rules[i].issuer;

        }
  }
})

// Our Webpack Configuration.
let webpackConfig = {
  ...baseConfig,
  target: 'web',
  devtool: false,
  output: {
    ...baseConfig.output,
    publicPath: `/`,
    clean: true
  },
  plugins: [
    ...baseConfig.plugins,
    new MiniCssExtractPlugin(
      {
        linkType: "text/css",
        filename: '[name].css'
      }
    )
  ],
  module: {
    rules: [
      ...baseConfig.module.rules,
      /*{
        test: /\.html$/,
        loader:'handlebars-loader'
      }*/
    ]
  },
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 500000
  }
};

if( process.env.CAWEB_SERVE ){
  delete webpackConfig.devServer;

  SiteGenerator( webpackConfig );
}

export default webpackConfig;