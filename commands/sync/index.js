/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import loadConfig from '@wordpress/env/lib/config/load-config.js';
import axios from 'axios';

// since we are in a spinner,
// we have to silence all the cancellation errors when using prompts
// .catch(() => {process.exit(1);})
import { confirm, input, password } from '@inquirer/prompts';

/**
 * Internal dependencies
 */
import {
	appPath,
    getTaxonomies,
    createTaxonomies
} from '../../lib/index.js';

import {
    bullet,
    info,
    promptGetInstanceInfo,
    promptSaveInstanceInfo,
    promptForSync,
    promptForId
} from './prompts.js';

const errors = [];
const configFile = path.join(appPath, 'caweb.json');

/**
 * Return all parent items for a given set of ids.
 *
 * @async
 * @param {Array} ids
 * @param {*} request
 * @param {string} [tax='pages']
 * @returns {unknown}
 */
async function getParentItems( objects, request, tax = 'pages' ){
    let parentItemsObjects = [];
    let objectParentIds = objects.map((obj) => { return obj.parent; }).filter(n => n);

    while( objectParentIds.length > 0 ){

        // if we have parent ids, we have to collect any parent items.
        let parentItems = await getTaxonomies({
            ...request, 
            orderby: 'parent',
            embed: true,
            include: objectParentIds
        }, tax);

        // if we have parent items, we have to add to the items array.
        if( parentItems ){
            parentItemsObjects = parentItemsObjects.concat( parentItems );
        }

        // if the parent items have parent ids, we have to save those for the next run.
        objectParentIds = parentItems.map((obj) => { return obj.parent; }).filter((id) => { return id !== 0; })   
    }

    return objects.concat( parentItemsObjects ).sort( (a,b) => a.parent - b.parent );
}


/**
 * Get information for an instance.
 *
 * @async
 * @param {string} [instance='target']
 * @returns {Object}
 */
async function getInstanceInfo( config, instance = 'target'){
    // ask for target information to be entered.
    const inputTarget = await confirm(
        { 
            message: `A ${instance} instance was not specified, would you like to enter the information?`,
            default: true
        }
    ).catch(() => {process.exit(1);});

    // if user said yes
    if( inputTarget ){
        let target = await promptGetInstanceInfo();

        // ask to save information
        let nickname = await promptSaveInstanceInfo()

        if( nickname ){
            config = config ?? {};

            // add the target to sync list
            config.sync[nickname] = target;

            fs.writeFileSync(
                configFile,
                JSON.stringify(config, null, 4)
            )
        }

        return target;
    }
}

/**
 * Sync Environments.
 * 
 * @see https://developer.wordpress.org/rest-api/reference/
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.target   Remote Site URL with current changes.
 * @param {boolean} options.dest   Destination Site URL that should be synced.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {Array} options.tax   Taxonomy that should be synced.
 * @param {Array} options.include   Include specific IDs only.
 */
export default async function sync({
	spinner,
	debug,
	target,
    dest,
    interactive,
    tax,
    mediaIds,
    menuIds,
    pageIds,
    postIds
} ) {

    // this gets the working directory path after wp-env validation
    const {workDirectoryPath} = await loadConfig(path.resolve('.'));

    // read caweb configuration file.    
    let serviceConfig = fs.existsSync(configFile) ? JSON.parse( fs.readFileSync(configFile) ) : { "sync": {} };

    process.env.WP_CLI_CONFIG_PATH  = path.join(workDirectoryPath, 'config.yml');
    
    // get target and dest instance data 
    target = serviceConfig.sync[target];
    dest = serviceConfig.sync[dest];

    // if no target was specified or no target saved.
    if( ! target ){
        spinner.stop()
        console.log( info, 'A target instance, this is the site containing the latest changes.')

        target = await getInstanceInfo(serviceConfig, 'target')

        // if still no target then exit
        if( ! target ){
                process.exit(1)
        }
    }


    // if no dest was specified or no dest saved.
    if( ! dest ){
        spinner.stop()
        console.log( info, 'A destination instance, this is the site where the latest changes should go.')
        dest = await getInstanceInfo(serviceConfig, 'destination');

        
        // if still no target then exit
        if( ! dest ){
            process.exit(1)
        }
    }
        
    /**
     * each instance has to have a url, user, pwd property
     */
    if( 
        ! target || ! target.url || ! target.user || ! target.pwd ||
        ! dest || ! dest.url || ! dest.user || ! dest.pwd
    ){
        spinner.fail(`caweb.json is not configured properly for ${target} and ${dest}.`);
        process.exit(1)
    }

    let targetOptions = {
        url: target.url,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${target.user}:${target.pwd}`).toString('base64')
        }
    }
    let destOptions = {
        url: dest.url,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${dest.user}:${dest.pwd}`).toString('base64'),
            'content-type': 'multipart/form-data',
            'accept': '*/*'
        }
    }

    /**
     * Sync Process 
     * If taxonomy is undefined then we don't sync that section.
     * 
     * 1) We collect media if the taxonomy is undefined or includes media, pages, posts.
     * 2) We only collect settings if the taxonomy is undefined or it's set to settings.
     * 3) We only collect pages if the taxonomy is undefined or it's set to pages.
     * 4) We only collect posts if the taxonomy is undefined or it's set to posts.
     * 5) We only collect menus if the taxonomy is undefined or it's set to menus.
     *    - We also collect menu items if menus are collected.
     */
    let settings = [];
    let mediaLibrary = [];
    let media = [];
    let pages = [];
    let posts = [];
    let menus = [];
    let menuNavItems = [];

    // Run prompts if interactive
    if( interactive ){
        spinner.stop();
        tax = await promptForSync(tax);

        let inputtedMediaIds = tax.includes('media') ? await promptForId('Media') : '';
        let inputtedMenuIds = tax.includes('menus') ? await promptForId('Menus') : '';
        let inputtedPageIds = tax.includes('pages') ? await promptForId('Pages') : '';
        let inputtedPostIds = tax.includes('posts') ? await promptForId('Posts') : '';

        // if inputted ids is all then we dont need ids, 
        inputtedMediaIds = 'all' === inputtedMediaIds ? [] : inputtedMediaIds.split(',');
        inputtedMenuIds = 'all' === inputtedMenuIds ? [] : inputtedMenuIds.split(',');
        inputtedPageIds = 'all' === inputtedPageIds ? [] : inputtedPageIds.split(',');
        inputtedPostIds = 'all' === inputtedPostIds ? [] : inputtedPostIds.split(',');

        mediaIds = mediaIds ? mediaIds.concat(inputtedMediaIds) : inputtedMediaIds;
        menuIds = menuIds ? menuIds.concat(inputtedMenuIds) : inputtedMenuIds;
        pageIds = pageIds ? pageIds.concat(inputtedPageIds) : inputtedPageIds;
        postIds = postIds ? postIds.concat(inputtedPostIds) : inputtedPostIds;

        spinner.start()

    }

    // Media Library.
    if( tax.includes('media', 'pages', 'posts') ){
        spinner.text = `Collecting Media Library ${target.url}`;
        mediaLibrary = await getTaxonomies({ 
                ...targetOptions, 
                fields: [
                    'id', 
                    'source_url', 
                    'title', 
                    'caption', 
                    'alt_text', 
                    'date',
                    'mime_type',
                    'post',
                    'media_details'
                ],
                include: mediaIds && mediaIds.length ? mediaIds.join(',') : null
            }, 
            'media'
        );
    }

    // Site Settings.
    if( tax.includes('settings') ){
        spinner.text = `Collecting Site Settings from ${target.url}`;
        settings = await getTaxonomies({
            ...targetOptions,
            fields: [
                'title',
                'description',
                'show_on_front',
                'page_on_front',
                'posts_per_page'
            ],
        }, 'settings')
        
    }

    // Pages.
    if( tax.includes('pages') ){
        // get all pages/posts
        spinner.text = `Collecting pages from ${target.url}`;
        pages = await getTaxonomies({
                ...targetOptions, 
                orderby: 'parent',
                embed: true,
                include: pageIds && pageIds.length ? pageIds.join(',') : null
            }, 
            'pages'
        );

        // pages can be nested so we have to collect any parent items.
        pages = await getParentItems( 
            pages, 
            targetOptions, 
            'pages'
        ) 
    }

    // Posts.
    if( tax.includes('posts') ){
        // get all pages/posts
        spinner.text = `Collecting all posts from ${target.url}`;
        posts = await getTaxonomies({
                ...targetOptions, 
                orderby: 'parent',
                include: postIds && postIds.length ? postIds.join(',') : null
            }, 
            'posts'
        );

        // posts can be nested so we have to collect any parent items.
        posts = await getParentItems( 
        posts, 
        targetOptions, 
        'posts'
    ) 
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
        // remove any new line characters.
        m.source_url = m.source_url.replace('\n','');

        /**
         * We collect the media if:
         * - media is attached
         * - id was explicitly requested
         * - tax includes media and media ids is blank
         */
        if( 
            m.post || 
            ( mediaIds && mediaIds.includes( m.id.toString() )  ) || 
            ( tax.includes('media') && undefined === mediaIds ) 
        ){
            media.push( m );

            // we don't have to check any further.
            continue;
        }

        for( let p of [].concat( pages, posts ) ){
            /**
             * We collect the media if:
             * - media is featured image 
             * - media is the src attribute in the content
             */
            if( p.featured_media === m.id ||
                p.content.rendered.match( new RegExp(`src=&#8221;(${m.source_url}.*)&#8221;`, 'g') )){
                    media.push( m );
                }
        }
    }

    // filter any duplicate media.
    media = media.filter((m, index, self) => { return index === self.findIndex((t) => { return t.id === m.id; })} );
    let i = 0;
    
    // before we can upload media files we have to generate the media blob data.
    for( let m of media ){
        if( debug ){
            i++;
            spinner.info(`Media ID ${m.id} Collected: ${i}/${media.length}`)
        }
        
        const mediaBlob = await axios.request( 
            {
                ...targetOptions,
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
    
    // this has to be done after we have the media data.
    // Lets replace the url references in the content of the pages and posts.
    for( let p of [].concat( pages, posts ) ){
        p.content.rendered = p.content.rendered.replace( new RegExp(target.url, 'g'), dest.url );
    }

    
    // Menu and Nav Items.
    if( tax.includes('menus')){
        spinner.text = `Collecting assigned navigation menus from ${target.url}`;
        // get all menus and navigation links
        menus = await getTaxonomies({
            ...targetOptions,
            fields: [
                'id',
                'description',
                'name',
                'slug',
                'meta',
                'locations'
            ],
            include: menuIds && menuIds.length ? menuIds.join(',') : null
            }, 'menus');
    
        menuNavItems = await getTaxonomies( 
            {
                ...targetOptions,
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

        let missingPages = [];
        let missingPosts = [];
        // we iterate over menu items
        menuNavItems.forEach(item => {
            // if the item is a page and it wasn't previously collected
            if( 'page' === item.object && ! pages.map(p => p.id ).includes(item.object_id) ){
                missingPages.push(item.object_id)
            // if the item is a post and it wasn't previously collected
            }else if( 'post' === item.object && ! posts.map(p => p.id ).includes(item.object_id) ){
                missingPosts.push(item.object_id)
            }
        })

        // if navigation pages weren't previously collected they must be collected.
        if( missingPages.length ){
            missingPages = await getTaxonomies({
                ...targetOptions, 
                orderby: 'parent',
                embed: true,
                include: missingPages.join(',')
                }, 
                'pages'
            );

            // pages can be nested so we have to collect any parent items.
            missingPages = await getParentItems( 
                missingPages, 
                targetOptions, 
                'pages'
            );
            
            // add the missing pages to the pages array
            pages = pages.concat(missingPages)
        }

        // if navigation posts weren't previously collected they must be collected.
        if( missingPosts.length ){
            // get all pages/posts
            spinner.text = `Collecting all posts from ${target.url}`;
            missingPosts = await getTaxonomies({
                    ...targetOptions, 
                    orderby: 'parent',
                    include: missingPosts.join(',')
                }, 
                'posts'
            );

            // posts can be nested so we have to collect any parent items.
            missingPosts = await getParentItems( 
                missingPosts, 
                targetOptions, 
                'posts'
            )
            
            // add the missing posts to the posts array
            posts = posts.concat(missingPages);
        }
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
    if( media ){
        spinner.text = `Uploading media files to ${dest.url}`;
        await createTaxonomies(
            media.filter((img) => { return img.data }), 
            destOptions, 
            'media', 
            spinner
            )
    }

     // Pages.
    if( pages ){
        spinner.text = `Creating all pages to ${dest.url}`;
        await createTaxonomies( pages, destOptions, 'pages', spinner );
    }

     // Posts.
    if( posts ){
        spinner.text = `Creating all posts to ${dest.url}`;
        await createTaxonomies( posts, destOptions, 'posts', spinner );
    }

    // Menus and Navigation Links.
    if( menus ){
        spinner.text = `Reconstructing navigation menus to ${dest.url}`;
        await createTaxonomies(menus, destOptions, 'menus', spinner);
        await createTaxonomies(menuNavItems, destOptions, 'menu-items', spinner);
    }
    

    // Settings.
    if( settings ){
        spinner.text = `Updating site settings to ${dest.url}`;
        await createTaxonomies(settings, destOptions, 'settings', spinner);
    }

    spinner.text = `Sync from ${target.url} to ${dest.url} completed successfully.`


};
