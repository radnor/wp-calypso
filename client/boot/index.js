/**
 * External dependencies
 */
var React = require( 'react' ),
	store = require( 'store' ),
	ReactInjection = require( 'react/lib/ReactInjection' ),
	some = require( 'lodash/collection/some' ),
	startsWith = require( 'lodash/string/startsWith' ),
	classes = require( 'component-classes' ),
	debug = require( 'debug' )( 'calypso' ),
	page = require( 'page' ),
	url = require( 'url' ),
	qs = require( 'querystring' ),
	injectTapEventPlugin = require( 'react-tap-event-plugin' );

/**
 * Internal dependencies
 */
// lib/local-storage must be run before lib/user
var config = require( 'config' ),
	localStoragePolyfill = require( 'lib/local-storage' )(), //eslint-disable-line
	analytics = require( 'analytics' ),
	route = require( 'lib/route' ),
	user = require( 'lib/user' )(),
	sites = require( 'lib/sites-list' )(),
	superProps = require( 'analytics/super-props' ),
	config = require( 'config' ),
	i18n = require( 'lib/mixins/i18n' ),
	translatorJumpstart = require( 'lib/translator-jumpstart' ),
	translatorInvitation = require( 'layout/community-translator/invitation-utils' ),
	layoutFocus = require( 'lib/layout-focus' ),
	nuxWelcome = require( 'nux-welcome' ),
	emailVerification = require( 'components/email-verification' ),
	viewport = require( 'lib/viewport' ),
	detectHistoryNavigation = require( 'lib/detect-history-navigation' ),
	sections = require( 'sections' ),
	touchDetect = require( 'lib/touch-detect' ),
	accessibleFocus = require( 'lib/accessible-focus' ),
	TitleStore = require( 'lib/screen-title/store' ),
	createReduxStore = require( 'state' ).createReduxStore,
	renderWithReduxStore = require( 'lib/react-helpers' ).renderWithReduxStore,
	// The following mixins require i18n content, so must be required after i18n is initialized
	Layout,
	LoggedOutLayout;


// perfmon temporary
var each = require( 'lodash/collection/each' ),
	remove = require( 'lodash/array/remove' );

const PLACEHOLDER_CLASSES = [
	'placeholder',
	'pulsing-dot is-active'
];

const PLACEHOLDER_MATCHER = PLACEHOLDER_CLASSES.map(function(clazz) { return `[class*='${clazz}']`; }).join(', ');
const OBSERVE_ROOT = document.getElementById('wpcom');

var perfmon = {
	activePlaceholders: [],
	placeholdersVisibleStart: null,

	init: function() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

		if ( MutationObserver ) {
			this.observeDomChanges( MutationObserver );
		}
	},

	isPlaceholder: function( node ) {
		var className = node.className;
		return className && PLACEHOLDER_CLASSES.some( function( clazz ) { 
			return (className.indexOf( clazz ) >= 0); 
		} );
	},

	// adapted from http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
	isElementInViewport: function( el ) {
		var rect = el.getBoundingClientRect();

		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
			rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
		);
	},

	recordPlaceholders: function( mutation ) { 
		var nodes = [];

		if ( mutation.attributeName === 'class' ) { // mutation.type === 'attributes' is redundant
			nodes = [mutation.target];
		} else if ( mutation.type === 'childList' && mutation.addedNodes.length > 0 ) {
			nodes = mutation.addedNodes;
		} else {
			return;
		}

		each( nodes, function( node ) {

			if ( this.isPlaceholder( node ) ) {
				this.recordPlaceholderNode( node );
			}

			// we need to find matching children because the mutation observer
			// only fires for the top element of an added subtree
			if ( node.querySelectorAll ) {
				// funky syntax because NodeList walks like an array but doesn't quack like one
				Array.prototype.forEach.call(
					node.querySelectorAll(PLACEHOLDER_MATCHER),
					this.recordPlaceholderNode
				);
			}
		}.bind( this ) );
	},

	recordPlaceholderNode: function( node ) {
		if ( this.activePlaceholders.indexOf( node ) >= 0 ) {
			// no-op
		} else {
			this.activePlaceholders.push(node);
		}
	},
 
	observeDomChanges: function( MutationObserver ) {

		// this is fired for matching mutations (childList and class attr changes)
		var observer = new MutationObserver(function(mutations, observer) {
			
			// record all the nodes that match our placeholder classes in the "activePlaceholders" array
			mutations.forEach( this.recordPlaceholders.bind( this ) );

			// remove any nodes from activePlaceholders that are no longer placeholders
			// check each node for:
			// a. whether it's still in the DOM at all, and if so:
			// b. whether it still has a placeholder class
			var removed = remove( this.activePlaceholders, function( node ) {
				return !OBSERVE_ROOT.contains( node ) || !this.isPlaceholder( node );
			}.bind( this ) );

			// determine how many placeholders are active in the viewport
			var visibleCount = 0;
			this.activePlaceholders.forEach( function( node ) {
				if ( this.isElementInViewport( node ) ) {
					visibleCount += 1;
				}
			}.bind( this ) );

			// if we can see placeholders, placeholdersVisibleStart is falsy, start the clock
			if ( visibleCount >= 0 && !this.placeholdersVisibleStart ) {
				this.placeholdersVisibleStart = Date.now(); // TODO: performance.now()?
			} else if ( visibleCount === 0 && this.placeholdersVisibleStart ) {
				// tell tracks to record duration
				analytics.pageLoading.record( Date.now() - this.placeholdersVisibleStart );
				this.placeholdersVisibleStart = null;
			}

			console.log("Active placeholders: "+this.activePlaceholders.length);
			if ( this.activePlaceholders.length === 1 ) {
				debugger;
			}
			console.log("Visible in viewport: "+visibleCount);

		}.bind( this ) );

		observer.observe(OBSERVE_ROOT, {
		  subtree: true,
		  attributes: true,
		  childList: true,
		  attributeFilter: ['class']
		});
	}
}

function init() {
	var i18nLocaleStringsObject = null;

	debug( 'Starting Calypso. Let\'s do this.' );

	// Initialize i18n
	if ( window.i18nLocaleStrings ) {
		i18nLocaleStringsObject = JSON.parse( window.i18nLocaleStrings );
	}
	i18n.initialize( i18nLocaleStringsObject );

	ReactInjection.Class.injectMixin( i18n.mixin );

	// Infer touch screen by checking if device supports touch events
	// See touch-detect/README.md
	if ( touchDetect.hasTouch() ) {
		classes( document.documentElement ).add( 'touch' );
	} else {
		classes( document.documentElement ).add( 'notouch' );
	}

	// Initialize touch
	injectTapEventPlugin();

	// Add accessible-focus listener
	accessibleFocus();

	// Set document title
	TitleStore.on( 'change', function() {
		var title = TitleStore.getState().formattedTitle;
		if ( title && title !== document.title ) {
			document.title = title;
		}
	} );
}

function setUpContext( layout, reduxStore ) {
	// Pass the layout so that it is available to all page handlers
	// and add query and hash objects onto context object
	page( '*', function( context, next ) {
		var parsed = url.parse( location.href, true );

		context.layout = layout;
		context.store = reduxStore;

		// Break routing and do full page load for logout link in /me
		if ( context.pathname === '/wp-login.php' ) {
			window.location.href = context.path;
			return;
		}

		// set `context.query`
		// debugger
		const querystringStart = context.canonicalPath.indexOf( '?' );
		if ( querystringStart !== -1 ) {
			context.query = qs.parse( context.canonicalPath.substring( querystringStart + 1 ) );
		} else {
			context.query = {};
		}
		context.prevPath = parsed.path === context.path ? false : parsed.path;

		// set `context.hash` (we have to parse manually)
		if ( parsed.hash && parsed.hash.length > 1 ) {
			try {
				context.hash = qs.parse( parsed.hash.substring( 1 ) );
			} catch ( e ) {
				debug( 'failed to query-string parse `location.hash`', e );
				context.hash = {};
			}
		} else {
			context.hash = {};
		}
		next();
	} );
}

function loadDevModulesAndBoot() {
	if ( config.isEnabled( 'render-visualizer' ) ) {
		// Use Webpack's code splitting feature to put the render visualizer in a separate fragment.
		// This way it won't get downloaded unless this feature is enabled.
		// Since loading this fragment is asynchronous and we need to inject this mixin into all React classes,
		// we have to wait for it to load before proceeding with the application's startup.
		require.ensure( [], function() {
			ReactInjection.Class.injectMixin( require( 'lib/mixins/render-visualizer' ) );
			boot();
		}, 'devmodules' );

		return;
	}

	boot();
}

function boot() {
	var layoutSection, layout, layoutElement, reduxStore, validSections = [];

	init();

	// When the user is bootstrapped, we also bootstrap the
	// locale strings
	if ( ! config( 'wpcom_user_bootstrap' ) ) {
		i18n.setLocaleSlug( user.get().localeSlug );
	}
	// Set the locale for the current user
	user.on( 'change', function() {
		i18n.setLocaleSlug( user.get().localeSlug );
	} );

	translatorJumpstart.init();

	reduxStore = createReduxStore();

	if ( user.get() ) {
		// When logged in the analytics module requires user and superProps objects
		// Inject these here
		analytics.initialize( user, superProps );

		// Create layout instance with current user prop
		Layout = require( 'layout' );

		layoutElement = React.createElement( Layout, {
			user: user,
			sites: sites,
			focus: layoutFocus,
			nuxWelcome: nuxWelcome,
			translatorInvitation: translatorInvitation
		} );
	} else {
		analytics.setSuperProps( superProps );

		if ( config.isEnabled( 'oauth' ) ) {
			LoggedOutLayout = require( 'layout/logged-out-oauth' );
		} else if ( startsWith( window.location.pathname, '/design' ) ) {
			LoggedOutLayout = require( 'layout/logged-out-design' );
		} else {
			LoggedOutLayout = require( 'layout/logged-out' );
		}

		layoutElement = React.createElement( LoggedOutLayout );
	}

	// Monitor time spent watching slowly-flashing divs
	perfmon.init();

	layout = renderWithReduxStore(
		layoutElement,
		document.getElementById( 'wpcom' ),
		reduxStore
	);

	debug( 'Main layout rendered.' );

	// If `?sb` or `?sp` are present on the path set the focus of layout
	// This needs to be done before the page.js router is started and can be removed when the legacy version is retired
	if ( window && [ '?sb', '?sp' ].indexOf( window.location.search ) !== -1 ) {
		layoutSection = ( window.location.search === '?sb' ) ? 'sidebar' : 'sites';
		layoutFocus.set( layoutSection );
		window.history.replaceState( null, document.title, window.location.pathname );
	}

	setUpContext( layout, reduxStore );
	page( '*', require( 'lib/route/normalize' ) );

	// warn against navigating from changed, unsaved forms
	page( '*', require( 'lib/mixins/protect-form' ).checkFormHandler );

	page( '*', function( context, next ) {
		var path = context.pathname;

		// Bypass this global handler for legacy routes
		// to avoid bumping stats and changing focus to the content
		if ( /.php$/.test( path ) ||
				/^\/?$/.test( path ) && ! config.isEnabled( 'reader' ) ||
				/^\/my-stats/.test( path ) ||
				/^\/(post\b|page\b)/.test( path ) && ! config.isEnabled( 'post-editor' ) ||
				/^\/notifications/.test( path ) ||
				/^\/themes/.test( path ) ||
				/^\/manage/.test( path ) ||
				/^\/plans/.test( path ) && ! config.isEnabled( 'manage/plans' ) ||
				/^\/me/.test( path ) && ! /^\/me\/billing/.test( path ) &&
				! /^\/me\/next/.test( path ) && ! config.isEnabled( 'me/my-profile' ) ) {
			return next();
		}

		// Focus UI on the content on page navigation
		if ( ! config.isEnabled( 'code-splitting' ) ) {
			layoutFocus.next();
		}

		// If `?welcome` is present show the welcome message
		if ( context.querystring === 'welcome' && context.pathname.indexOf( '/me/next' ) === -1 ) {
			// show welcome message, persistent for full sized screens
			nuxWelcome.setWelcome( viewport.isDesktop() );
		} else {
			nuxWelcome.clearTempWelcome();
		}

		// Bump general stat tracking overall Newdash usage
		analytics.mc.bumpStat( { newdash_pageviews: 'route' } );

		next();
	} );

	page( '*', function( context, next ) {
		if ( '/me/account' !== context.path && user.get().phone_account ) {
			page( '/me/account' );
		}

		next();
	} );

	page( '*', function( context, next ) {
		emailVerification.renderNotice( context );
		next();
	} );

	// clear notices
	page( '*', require( 'notices' ).clearNoticesOnNavigation );

	if ( config.isEnabled( 'oauth' ) ) {
		// Forces OAuth users to the /login page if no token is present
		page( '*', require( 'auth/controller' ).checkToken );
	}

	// Load the application modules for the various sections and features
	sections.load();

	// delete any lingering local storage data from signup
	if ( ! startsWith( window.location.pathname, '/start' ) ) {
		[ 'signupProgress', 'signupDependencies' ].forEach( store.remove );
	}

	validSections = sections.get().reduce( function( acc, section ) {
		return section.enableLoggedOut ? acc.concat( section.paths ) : acc;
	}, [] );

	if ( ! user.get() ) {
		// Dead-end the sections the user can't access when logged out
		page( '*', function( context, next ) {
			var isValidSection = some( validSections, function( validPath ) {
				return startsWith( context.path, validPath );
			} );

			if ( '/' === context.path && config.isEnabled( 'devdocs/redirect-loggedout-homepage' ) ) {
				page.redirect( '/devdocs/start' );
				return;
			}

			if ( isValidSection ) {
				next();
			}
		} );
	}

	page( '*', function( context, next ) {
		// Reset the selected site before each route is executed. This needs to
		// occur after the sections routes execute to avoid a brief flash where
		// sites are reset but the next section is waiting to be loaded.
		if ( ! route.getSiteFragment( context.path ) && sites.getSelectedSite() ) {
			sites.resetSelectedSite();
		}

		next();
	} );

	require( 'my-sites' )();

	if ( config.isEnabled( 'olark' ) ) {
		require( 'lib/olark' );
	}

	if ( config.isEnabled( 'keyboard-shortcuts' ) ) {
		require( 'lib/keyboard-shortcuts/global' )( sites );
	}

	if ( config.isEnabled( 'network-connection' ) ) {
		require( 'lib/network-connection' ).init();
	}

	if ( config.isEnabled( 'desktop' ) ) {
		require( 'lib/desktop' ).init();
	}

	detectHistoryNavigation.start();
	page.start();
}

window.AppBoot = function() {
	if ( user.initialized ) {
		loadDevModulesAndBoot();
	} else {
		user.once( 'change', function() {
			loadDevModulesAndBoot();
		} );
	}
};
