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
    tax
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
        }
    }
    
    let ssh = 'local' !== to ? to : `docker:${path.basename(workDirectoryPath)}-cli-1`;

    to = serviceConfig.sync[to];

    let toOptions = {
        url: to.url,
        ssh,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${to.user}:${to.pwd}`).toString('base64'),
            'content-type': 'multipart/form-data',
            'accept': '*/*'
        }
    }

    let pages = [];
    let posts = [];
    let attachedMedia = [];
    let featuredMedia = [];
    let menus = [];
    let menuNavItems = [];

    // get all settings 
    // site settings are always synced
    spinner.text = `Getting Site Settings from ${from.url}`;
    let settings = await getTaxonomies({
        ...fromOptions,
        fields: [
            'show_on_front',
            'page_on_front'
        ],
    }, 'settings')
    
    /**
     * If taxonomy is undefined then we sync everything, otherwise we only sync what's being requested.
     * First we collect everything we need from the base, then we send the information to the target.
     * If media is requested then we need to download posts/pages to get any attached/featured media.
     */
    // collect pages
    if( undefined === tax || tax.includes('pages') || tax.includes('media')){
        // get all pages/posts
        spinner.text = `Gathering all pages from ${from.url}`;
        pages = await getTaxonomies(fromOptions);
    }

    // collect posts
    if( undefined === tax || tax.includes('posts')|| tax.includes('media')){
        // get all pages/posts
        spinner.text = `Gathering all posts from ${from.url}`;
        posts = await getTaxonomies(fromOptions, 'posts');
    }

    // collect media
    if( undefined === tax || tax.includes('media')){
       
        spinner.text = `Collecting all attached/featured images from ${from.url}`;
        /**
         * Media Library Handling
         * 1) attached media items by default are only possible on pages.
         * 2) featured media by default are only possible on posts.
         */
        const mediaFields = [
            'id', 
            'source_url', 
            'title', 
            'caption', 
            'alt_text', 
            'date',
            'mime_type'
        ];
        attachedMedia = await getTaxonomies({ 
                ...fromOptions, 
                fields: mediaFields,
                parent: pages.map((p) => { return p.id })
            }, 
            'media'
        );

        featuredMedia = await getTaxonomies({ 
                ...fromOptions, 
                fields: mediaFields,
                include: posts.map((p) => { if(p.featured_media){return p.featured_media } })
            }, 
            'media'
        );
        
        // before we can upload media files.
        for( let mediaObj of [].concat( attachedMedia, featuredMedia ) ){
            // generate a blob from the media object source_url.
            const mediaBlob = await axios.request( 
                {
                    ...fromOptions,
                    url: mediaObj.source_url,
                    responseType: 'arraybuffer'
                } 
            )
            .then( (img) => {  return new Blob([img.data]) })
            .catch( (error) => {
                errors.push(`${mediaObj.source_url} could not be downloaded.`)
                return false;
            });
            
            if( mediaBlob ){
                mediaObj.data = mediaBlob;
            }
        }
    }

    // collect menu and nav items.
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
     * Creation order is important otherwise missing dependencies will cause errors to trigger.
     * We create media first, then pages, then posts, then menus and navigation links.
     */

    // create media attachments
    if( undefined === tax || tax.includes('media')){
        spinner.text = `Uploading media files to ${to.url}`;
        await createTaxonomies(
            [].concat( attachedMedia, featuredMedia ).filter((img) => { return img.data }), 
            toOptions, 
            'media', 
            spinner
            )
    }

     // create pages
    if( undefined === tax || tax.includes('pages')){
        spinner.text = `Creating all pages to ${to.url}`;
        await createTaxonomies( pages, toOptions, 'pages', spinner );
    }

     // create posts
    if( undefined === tax || tax.includes('posts')){
        spinner.text = `Creating all posts to ${to.url}`;
        await createTaxonomies( posts, toOptions, 'posts', spinner );
    }

    // create menus and navigation links
    if( undefined === tax || tax.includes('menus')){
        spinner.text = `Reconstructing navigation menus to ${to.url}`;
        await createTaxonomies(menus, toOptions, 'menus', spinner);
        await createTaxonomies(menuNavItems, toOptions, 'menu-items', spinner);
    }
    

    // update settings
    await createTaxonomies(settings, toOptions, 'settings', spinner);

    spinner.text = `Sync from ${from.url} to ${to.url} completed successfully.`

};
