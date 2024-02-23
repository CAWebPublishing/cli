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
 */
export default async function sync({
	spinner,
	debug,
	from,
    to
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
        
    // get all settings 
    spinner.text = `Getting Site Settings from ${from.url}`;
    let settings = await getTaxonomies({
        ...fromOptions,
        fields: [
            'show_on_front',
            'page_on_front'
        ],
    }, 'settings')
    
    // get all pages/posts
    spinner.text = `Gathering all pages/posts from ${from.url}`;
    let pages = await getTaxonomies(fromOptions);
    let posts = await getTaxonomies(fromOptions, 'posts');

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
    let attachedMedia = await getTaxonomies({ 
            ...fromOptions, 
            fields: mediaFields,
            parent: pages.map((p) => { return p.id })
        }, 
        'media'
    );

    let featuredMedia = await getTaxonomies({ 
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
    
    spinner.text = `Collecting assigned navigation menus from ${from.url}`;
    // get all menus and navigation links
    let menus = await getTaxonomies({
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

    let menuNavItems = await getTaxonomies( 
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
    
    // create all pages/posts
    spinner.text = `Creating all pages/posts to ${to.url}`;
    await createTaxonomies( pages, toOptions, 'pages', spinner );
    await createTaxonomies( posts, toOptions, 'posts', spinner );

    // create media attachments
    spinner.text = `Uploading media files to ${to.url}`;
    await createTaxonomies(
        [].concat( attachedMedia, featuredMedia ).filter((img) => { return img.data }), 
        toOptions, 
        'media', 
        spinner
        )
        
    // create menus and navigation links
    spinner.text = `Reconstructing navigation menus to ${to.url}`;
    await createTaxonomies(menus, toOptions, 'menus', spinner);
    await createTaxonomies(menuNavItems, toOptions, 'menu-items', spinner);

    // update settings
    await createTaxonomies(settings, toOptions, 'settings', spinner);

    spinner.text = `Sync from ${from.url} to ${to.url} completed successfully.`

};
