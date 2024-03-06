/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import axios from 'axios';

/**
 * Internal dependencies
 */
import {
	appPath,
    getTaxonomies,
    createTaxonomies
} from '../lib/index.js';

const errors = [];


/**
 * Sync Environments.
 * 
 * @see https://developer.wordpress.org/rest-api/reference/settings/
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.from   Remote Site URL with current changes.
 * @param {boolean} options.to   Destination Site URL that should be synced.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {Array} options.tax   Taxonomy that should be synced.
 */
export default async function sync({
	spinner,
	debug,
	from,
    to,
    tax,
    id
} ) {

    const localFile = path.join(appPath, 'caweb.json');
    const {workDirectoryPath} = await loadConfig(path.resolve('.'));
		
    process.env.WP_CLI_CONFIG_PATH  = path.join(workDirectoryPath, 'config.yml');
    
    // if caweb.json file doesn't exist we don't do anything
    if( ! fs.existsSync(localFile) ){
        spinner.fail('caweb.json file not found.')
        process.exit(1)
    }

    // read configuration file
    const serviceConfig = JSON.parse( fs.readFileSync(localFile) );

    /**
     * make sure instances are in the file.
     * must have sync property
     * each instance has to have a url, user, pwd property
     */
    if( 
        ! serviceConfig.sync || 
        ! serviceConfig.sync[from] ||
        ! serviceConfig.sync[from].url ||
        ! serviceConfig.sync[from].user ||
        ! serviceConfig.sync[from].pwd ||
        ! serviceConfig.sync[to] || 
        ! serviceConfig.sync[to].url ||
        ! serviceConfig.sync[to].user ||
        ! serviceConfig.sync[to].pwd
    ){
        spinner.fail(`caweb.json is not configured properly for ${from} and ${to}.`);
        process.exit(1)
    }
    
    // get instance data
    from = serviceConfig.sync[from];
    let fromOptions = {
        url: from.url,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${from.user}:${from.pwd}`).toString('base64')
        },
        include: tax && id ? id.join(',') : null // if tax and id are set then we only want to get the specific items.
    }
    

    to = serviceConfig.sync[to];

    let toOptions = {
        url: to.url,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${to.user}:${to.pwd}`).toString('base64'),
            'content-type': 'multipart/form-data',
            'accept': '*/*'
        }
    }

    /**
     * Sync Process 
     * If taxonomy is undefined then we don't sync that section.
     * 
     * 1) Site Settings are always synced.
     * 2) We always collect all the media.
     * 3) We only collect pages if the taxonomy is undefined or it's set to pages.
     * 4) We only collect posts if the taxonomy is undefined or it's set to posts.
     * 5) We only collect menus if the taxonomy is undefined or it's set to menus.
     *    - We also collect menu items if menus are collected.
     */
    let pages = [];
    let posts = [];
    let media = [];

    let menus = [];
    let menuNavItems = [];

    // Site Settings.
    spinner.text = `Getting Site Settings from ${from.url}`;
    let settings = await getTaxonomies({
        ...fromOptions,
        fields: [
            'show_on_front',
            'page_on_front',
            'posts_per_page'
        ],
    }, 'settings')
    
    // Media Library.
    let mediaLibrary = await getTaxonomies({ 
            ...fromOptions, 
            fields: [
                'id', 
                'source_url', 
                'title', 
                'caption', 
                'alt_text', 
                'date',
                'mime_type',
                'post'
            ]
        }, 
        'media'
    );

    // Pages.
    if( undefined === tax || tax.includes('pages') ){
        // get all pages/posts
        spinner.text = `Gathering all pages from ${from.url}`;
        pages = await getTaxonomies({...fromOptions, orderby: 'parent'}, 'pages');
    }

    // Posts.
    if( undefined === tax || tax.includes('posts') ){
        // get all pages/posts
        spinner.text = `Gathering all posts from ${from.url}`;
        posts = await getTaxonomies({...fromOptions, orderby: 'parent'}, 'posts');
    }

    /**
     * Media Library Handling
     * 
     * We iterate thru the media library to identify which media should be synced.
     * 1) attached media items by default are only possible on pages.
     * 2) featured media by default are only possible on posts.
     * 3) save any linked media in the content of pages and posts.
     */
    for( let m of mediaLibrary ){
        // check if the media is attached to a page.
        if( m.post ){
            media.push( m );

            // we don't have to check any further.
            continue;
        }

        for( let p of [].concat( pages, posts ) ){
            // if the media is featured on a post or linked in the content.
            if( p.featured_media === m.id ||
                p.content.rendered.match( new RegExp(`src=&#8221;(${m.source_url}.*)&#8221;`, 'g') )){
                media.push( m );
            }
        }
    }

    // filter any duplicate media.
    media = media.filter((m, index, self) => { return index === self.findIndex((t) => { return t.id === m.id; })} );
    
    // before we can upload media files we have to generate the media blob data.
    for( let m of media ){
        const mediaBlob = await axios.request( 
            {
                ...fromOptions,
                url: m.source_url,
                responseType: 'arraybuffer'
            } 
        )
        .then( (img) => {  return new Blob([img.data]) })
        .catch( (error) => {
            errors.push(`${m.source_url} could not be downloaded.`)
            return false;
        });
        
        if( mediaBlob ){
            m.data = mediaBlob;
        }
    }


    // Menu and Nav Items.
    if( undefined === tax || tax.includes('menus')){
        spinner.text = `Collecting assigned navigation menus from ${from.url}`;
        // get all menus and navigation links
        menus = await getTaxonomies({
            ...fromOptions,
            fields: [
                'id',
                'description',
                'name',
                'slug',
                'meta',
                'locations'
            ]
            }, 'menus');
    
        menuNavItems = await getTaxonomies( 
            {
                ...fromOptions,
                fields: [
                    'id',
                    'title',
                    'url',
                    'status',
                    'attr_title',
                    'description',
                    'type',
                    'type_label',
                    'object',
                    'object_id',
                    'parent',
                    'menu_order',
                    'target',
                    'classes',
                    'xfn',
                    'meta',
                    'menus'
                ],
                menus: menus.map((menu) => { return menu.id; })
            }, 
            'menu-items'
            )

    }

    /**
     * Now we have all the data we can begin to create the taxonomies on the target.
     * 
     * Import Order is important otherwise missing dependencies will cause errors to trigger
     * 1) Media
     * 2) Pages
     * 3) Posts
     * 4) Menus & Navigation Links
     * 5) Settings
     */

    // Media.
    if( undefined === tax || tax.includes('media')){
        spinner.text = `Uploading media files to ${to.url}`;
        await createTaxonomies(
            media.filter((img) => { return img.data }), 
            toOptions, 
            'media', 
            spinner
            )
    }

     // Pages.
    if( undefined === tax || tax.includes('pages')){
        spinner.text = `Creating all pages to ${to.url}`;
        await createTaxonomies( pages, toOptions, 'pages', spinner );
    }

     // Posts.
    if( undefined === tax || tax.includes('posts')){
        spinner.text = `Creating all posts to ${to.url}`;
        await createTaxonomies( posts, toOptions, 'posts', spinner );
    }

    // Menus and Navigation Links.
    if( undefined === tax || tax.includes('menus')){
        spinner.text = `Reconstructing navigation menus to ${to.url}`;
        await createTaxonomies(menus, toOptions, 'menus', spinner);
        await createTaxonomies(menuNavItems, toOptions, 'menu-items', spinner);
    }
    

    // update settings
    await createTaxonomies(settings, toOptions, 'settings', spinner);

    spinner.text = `Sync from ${from.url} to ${to.url} completed successfully.`

};
