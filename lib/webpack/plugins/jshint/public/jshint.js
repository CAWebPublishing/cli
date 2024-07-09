
  
const cssAudit = {};

document.addEventListener( 'DOMContentLoaded', () => {
	const button = document.querySelector( '.button__theme-toggle' );

	cssAudit.toggleDarkMode = function() {
		const isDarkMode = document.body.classList.contains( 'is-dark-mode' );
		if ( isDarkMode ) {
			button.setAttribute( 'aria-pressed', 'false' );
			document.body.classList.remove( 'is-dark-mode' );
		} else {
			button.setAttribute( 'aria-pressed', 'true' );
			document.body.classList.add( 'is-dark-mode' );
		}
	}

	// Set is-dark-mode class if user has requested dark mode.
	if ( window.matchMedia( '(prefers-color-scheme: dark)' ).matches ){
		document.body.classList.add( 'is-dark-mode' );
		button.setAttribute( 'aria-pressed', 'true' );
	}

});
