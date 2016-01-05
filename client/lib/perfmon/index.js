/** 
 * Internal dependencies
 */
import analytics from 'analytics';

/**
 * External dependencies
 */
import each from 'lodash/collection/each';
import remove from 'lodash/array/remove';
import debounce from 'lodash/function/debounce';
import page from 'page';

var debug = require( 'debug' )( 'calypso:perfmon' );

const PLACEHOLDER_CLASSES = [
	'placeholder',
	'pulsing-dot is-active',
	'is-loading'
];

const PLACEHOLDER_MATCHER = PLACEHOLDER_CLASSES.map(function(clazz) { return `[class*='${clazz}']`; }).join(', ');
const OBSERVE_ROOT = document.getElementById('wpcom');

let activePlaceholders = [];
let placeholdersVisibleStart = null;

var perfmon = {

	init: function() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

		if ( MutationObserver ) {
			this.observeDomChanges( MutationObserver );
		}
	},

	isPlaceholder: function( node ) {
		var className = node.className;
		return className && className.indexOf && PLACEHOLDER_CLASSES.some( function( clazz ) { 
			return (className.indexOf( clazz ) >= 0); 
		} );
	},

	// adapted from http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
	isElementVisibleInViewport: function( node ) {
		var rect = node.getBoundingClientRect();

		// discard if width or height are zero
		if ( (rect.top - rect.bottom) === 0 || (rect.right - rect.left) === 0) {
			return false;
		}

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
					this.recordPlaceholderNode.bind( this )
				);
			}
		}.bind( this ) );
	},

	recordPlaceholderNode: function( node ) {
		if ( activePlaceholders.indexOf( node ) >= 0 ) {
			// no-op
		} else {
			activePlaceholders.push(node);
		}
	},
 
	observeDomChanges: function( MutationObserver ) {

		// if anything scrolls, check if any of our placeholder elements are in view,
		// but not more than a few times a second
		window.addEventListener('scroll', debounce(this.checkForVisiblePlaceholders.bind( this, 'scroll' ), 200), true);


		// if the user navigates, stop the current event and proceed to the next one
		page( function( context, next ) {
			// send "placeholder-wait-navigated" event
			this.checkForVisiblePlaceholders( 'navigate' );
			next();
		}.bind( this ) );


		// this is fired for matching mutations (childList and class attr changes)
		var observer = new MutationObserver(function(mutations, observer) {
			
			// record all the nodes that match our placeholder classes in the "activePlaceholders" array
			mutations.forEach( this.recordPlaceholders.bind( this ) );

			// remove any nodes from activePlaceholders that are no longer placeholders
			// check each node for:
			// a. whether it's still in the DOM at all, and if so:
			// b. whether it still has a placeholder class
			var removed = remove( activePlaceholders, function( node ) {
				return !OBSERVE_ROOT.contains( node ) || !this.isPlaceholder( node );
			}.bind( this ) );

			this.checkForVisiblePlaceholders( 'mutation' );

		}.bind( this ) );

		observer.observe(OBSERVE_ROOT, {
		  subtree: true,
		  attributes: true,
		  childList: true,
		  attributeFilter: ['class']
		});
	},

	checkForVisiblePlaceholders: function( trigger ) {

		// determine how many placeholders are active in the viewport
		var visibleCount = 0;
		activePlaceholders.forEach( function( node ) {
			if ( this.isElementVisibleInViewport( node ) ) {
				visibleCount += 1;
			}
		}.bind( this ) );

		// record event and reset timer if all placeholders are loaded OR user has just navigated
		if ( placeholdersVisibleStart && ( visibleCount === 0 || trigger === 'navigate' ) ) {
			// tell tracks to record duration
			analytics.pageLoading.record( `placeholder-wait-${trigger}`, Date.now() - placeholdersVisibleStart );
			placeholdersVisibleStart = null;
		}

		// if we can see placeholders, placeholdersVisibleStart is falsy, start the clock
		if ( visibleCount > 0 && !placeholdersVisibleStart ) {
			placeholdersVisibleStart = Date.now(); // TODO: performance.now()?
		}

		debug("Active placeholders: "+activePlaceholders.length);
		debug("Visible in viewport: "+visibleCount);
	}
}

module.exports = function() {
	perfmon.init()
};