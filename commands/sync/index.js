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
import { get } from 'http';
import { connect } from 'http2';
import { create } from 'domain';

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
async function getParentItems( objects, request, tax = 'pages', debug = false ){
    let parentItemsObjects = [];
    let objectParentIds = objects.map((obj) => { return obj.parent; }).filter(n => n);

    while( objectParentIds.length > 0 ){

        // if we have parent ids, we have to collect any parent items.
        let parentItems = await getTaxonomies({
            ...request, 
            orderby: 'parent',
            embed: true,
            include: objectParentIds
        }, tax, debug);

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
            config['sync'][nickname] = target;

            fs.writeFileSync(
                configFile,
                JSON.stringify(config, null, 4)
            )
        }

        return target;
    }
}

/**
 * 
 * @param {*} navJson 
 * @param {*} destUrl 
 * @returns {Array}
 */
function getStaticNavItems(navJson, destUrl){
    let navItems = [];

    // iterate over the nav items
    for( let item of navJson ){
        let i = {
            title: item.label,
            url: item.url
        }

        if( item.description ){
            i.description = item.description;
        }

        // if the item url is not the same as the destination url
        // and is not relative, then the item is an external link
        // if( item.url !== destUrl && ! item.url.startsWith('/') ){
        //     navItems.push(i)
        // }else 
        if( item.url.startsWith('/') ){
            // we remove the forward slash and the file extension if applicable
            i.slug = item.url.replace(/^\//, '').replace(/\.[^/.]+$/, '');
            i.url = `${destUrl}/${i.slug}`;
            i.type = 'post_type';
            i.object = 'page';
        }
        
        // if there is a submenu
        if( item.sub && item.sub.length ){
            i.sub = getStaticNavItems(item.sub, destUrl);
        }

            
        navItems.push(i)

    }

    return navItems;

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
    let serviceConfig = fs.existsSync(configFile) ? JSON.parse( fs.readFileSync(configFile) ) : { sync: {} };

    process.env.WP_CLI_CONFIG_PATH  = path.join(workDirectoryPath, 'config.yml');
    
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
        spinner.fail(`caweb.json is not configured properly.`);
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
    let settings = [{}];
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

    // if the request is going from static,
    // we create a taxonomies object based off of the static data.
    if( 'static' === target.url  ){
        let mediaPath = serviceConfig.media;

        // iterate over pages and create a pages object.
        for( let page of serviceConfig.pages ){
            let content = page.shortcodeContent.replace('\"', '"');

            pages.push({
                title: page.title,
                status: 'publish',
                slug: page.slug,
                content,
                meta: {
                    _et_pb_use_builder: 'on', // this turns on the Divi Builder
                }
            })
        }

        // Header Nav
        if( serviceConfig?.site?.header?.nav ){
            menus.push({
                name: 'Header Menu',
                slug: 'header-menu',
                locations: 'header-menu',
            });

            menuNavItems['header'] = getStaticNavItems(serviceConfig.site.header.nav, destOptions.url);

        }

        // Footer Nav
        if( serviceConfig?.site?.footer?.nav ){
            menus.push({
                name: 'Footer Menu',
                slug: 'footer-menu',
                locations: 'footer-menu',
            });

            menuNavItems['footer'] = getStaticNavItems(serviceConfig.site.footer.nav, destOptions.url);

        }

        // if the media path exists
        if( fs.existsSync(mediaPath) ){
            let currentDate = new Date();
            let uploadDir = path.join(
                'wp-content', 'uploads',
                currentDate.getFullYear().toString(), (currentDate.getMonth() + 1).toString().padStart(2, '0')
            );

            // we read all the files in the media directory and create a media object.
            fs.readdirSync(mediaPath, {recursive: true}).forEach( (file) => {

                // update page content file references
                pages.forEach((page) => {
                    // if the page content includes the file, we replace it the WordPress site upload dir.
                    if( page.content && page.content.includes(file) ){
                        // unescape slashes added from path.join.
                        page.content = page.content.replace(
                            new RegExp(`"[\\S]*${file}`, 'g'), 
                            `"${destOptions.url}/` + path.join(uploadDir, file).replace(/\\/g, '/')
                        );

                    }
                })

                // if the file is a file, we read it and create a media object.
                let filePath = path.join(mediaPath, file);

                if( fs.statSync(filePath).isFile() ){
                    // read the file and create a media object.
                    let mediaBlob = fs.readFileSync(filePath);

                    // and new media object
                    media.push({
                        source_url: filePath,
                        title: path.basename(filePath).replace(/\.[^/.]+$/, ""),
                        alt_text: path.basename(filePath).replace(/\.[^/.]+$/, ""),
                        media_details:{},
                        date: currentDate.toISOString(),
                        data: new Blob([mediaBlob])
                    });
                }   
            })
        }
        
        // Settings
        settings[0] = {
            title: serviceConfig?.site?.title,
        }

    }else{

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
                'media', 
                debug
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
            }, 'settings', debug )
            
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
                'pages', 
                debug
            );

            // pages can be nested so we have to collect any parent items.
            pages = await getParentItems( 
                pages, 
                targetOptions, 
                'pages',
                debug
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
                'posts',
                debug
            );

            // posts can be nested so we have to collect any parent items.
            posts = await getParentItems( 
            posts, 
            targetOptions, 
            'posts',
            debug
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
            if( p.content.rendered ){
                p.content.rendered = p.content.rendered.replace( new RegExp(target.url, 'g'), dest.url );
            }
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
                }, 'menus', debug);
        
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
                'menu-items', 
                debug
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
                    'pages', 
                    debug
                );

                // pages can be nested so we have to collect any parent items.
                missingPages = await getParentItems( 
                    missingPages, 
                    targetOptions, 
                    'pages',
                    debug
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
                    'posts', 
                    debug
                );

                // posts can be nested so we have to collect any parent items.
                missingPosts = await getParentItems( 
                    missingPosts, 
                    targetOptions, 
                    'posts',
                    debug
                )
                
                // add the missing posts to the posts array
                posts = posts.concat(missingPages);
            }
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
     let createdPages = [];
    if( pages ){
        spinner.text = `Creating all pages to ${dest.url}`;
        createdPages = await createTaxonomies( pages, destOptions, 'pages', spinner );
    }

     // Posts.
    if( posts ){
        spinner.text = `Creating all posts to ${dest.url}`;
        await createTaxonomies( posts, destOptions, 'posts', spinner );
    }

    // Menus and Navigation Links.
    if( menus ){
        spinner.text = `Reconstructing navigation menus to ${dest.url}`;
        let createdMenus = await createTaxonomies(menus, destOptions, 'menus', spinner);

        // this variable is only used if the request is going from static
        // we initialize it here outside of the if statement
        // since we need to assign the ids of the created menu items to the sub menu items.
        let subMenus = [];

        // only if the request is going from static
        if( 'static' === target.url ){
            let headerMenu = createdMenus.find((menu) => { return menu.slug === 'header-menu'; }) || {};
            let footerMenu = createdMenus.find((menu) => { return menu.slug === 'footer-menu'; }) || {};

            /**
             * Modify menu items.
             * 
             * We iterate over the menu items and delete certain properties.
             * We also assign the menu id to the menu items.
             * We also assign the page id to the menu items if they have a slug.
             * 
             */
            Object.entries(menuNavItems).forEach(([key, value]) => {
                let menuId = 'header' === key ? headerMenu?.id : footerMenu?.id;

                //  if the required menu is not created, we delete the menu item
                if( ! menuId ){
                    delete menuNavItems[key];
                    return;
                }

                value.forEach((v, k) => {
                    // assign the newly created menu ids to the menu items
                    v.menus = menuId;
                    
                    // if the item has a slug we update the url and remove the slug property
                    if( v.slug ){
                        // find the page id
                        let pageId = createdPages.find((p) => { return p.slug === v.slug; })?.id;

                        v.object_id = pageId;

                        delete v.slug;
                    }

                    // if the item has sub items we have to assign the sub items to the parent item
                    if( v.sub ){
                        v.sub.forEach((subItem, subIndex) => {
                            subItem.menus = menuId;

                            // if the item has a slug we update the url and remove the slug property
                            if( subItem.slug ){
                                // find the page id
                                let subPageId = createdPages.find((p) => { return p.slug === subItem.slug; })?.id;

                                subItem.object_id = subPageId;

                                delete subItem.slug;
                            }
                        })

                        subMenus[k] = v.sub;

                        delete v.sub;
                    }
                })

                // this ensures that the array contains only the menu items
                // we add the value back to the menuNavItems
                // delete the key from the menuNavItems
                menuNavItems = [
                    ...menuNavItems,
                    ...value
                ]

                delete menuNavItems[key];
            })
        }
        
        let createdMenuItems = await createTaxonomies(menuNavItems, destOptions, 'menu-items', spinner);

        // if we have sub menus, we have to create them as well.
        if( subMenus && subMenus.length ){
            // we iterate over the sub menus and assign the parent id to the sub menu items
            subMenus.forEach((sub, index) => {
                sub.forEach((s) => {
                    s.parent = createdMenuItems[index].id;
                    s.menu_order = index;
                })
            })

            // now we can create the sub menus
            await createTaxonomies(subMenus.filter( i => i).flat(), destOptions, 'menu-items', spinner);
        }
    }
    

    // Settings.
    if( settings ){
        spinner.text = `Updating site settings to ${dest.url}`;

        // if going from static, we have to set the homepage and posts page.
        if( 'static' === target.url ){
            let homepageID = createdPages.find((p) => { return 'index' === p.slug; })?.id || 0;

            if( homepageID ){
                settings[0]['page_on_front'] = homepageID;
                settings[0]['show_on_front'] = 'page';
            }
        }

        await createTaxonomies(settings, destOptions, 'settings', spinner);
    }

    spinner.text = `Sync from ${target.url} to ${dest.url} completed successfully.`


};
