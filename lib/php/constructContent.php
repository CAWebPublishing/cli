<?php
/**
 * Intented to be used with caweb-cli
 * 
 */

 if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

function constructContent( $path, $args ){
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $post_array = array(

    );

    foreach ($iterator as $item) {
        $path = $item->getPathname();
        if ($item->isFile()) {

        } elseif ($item->isDir()) {
            /**
			 * If the directory contains a file with the same name as the directory
			 * create that page first, and nest remaining pages under the newly created page/post.
			 */
			$parentPage = sprintf('%1$s/%2$s.txt', $path, $item->getFilename() );
            print $parentPage . PHP_EOL;
            if ( file_exists( $parentPage ) ){


            }
        }
    }
}

function generate( $args ){
    $genDir = getenv('HOME'). "/generation/";
    print_r( glob( $genDir . '*') );

	foreach ( glob( $genDir ) as $file ) {

    }
    //constructContent( $genDir, $args );
}

generate( $args );


?>