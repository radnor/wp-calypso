/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import MasterbarItem from './item';
import config from 'config';
import SitesPopover from 'components/sites-popover';
import paths from 'lib/paths';
import viewport from 'lib/viewport';

export default React.createClass( {
	displayName: 'MasterbarItemNew',

	_preloaded: false,

	propTypes: {
		user: React.PropTypes.object,
		sites: React.PropTypes.object,
		isActive: React.PropTypes.bool,
		className: React.PropTypes.string,
		tooltip: React.PropTypes.string,
	},

	getInitialState() {
		return {
			isShowingPopover: false
		};
	},

	setPostButtonContext( component ) {
		this.setState( {
			postButtonContext: component
		} );
	},

	toggleSitesPopover( isShowingPopover = ! this.state.isShowingPopover ) {
		// Setting state in the context of a touchTap event (i.e. SitePicker
		// Site onSelect) prevents link navigation from proceeding
		setTimeout( this.setState.bind( this, {
			isShowingPopover: isShowingPopover
		} ), 0 );
	},

	onClick( event ) {
		const visibleSiteCount = this.props.user.get().visible_site_count;

		// if multi-site and editor enabled, show site-selector
		if ( visibleSiteCount > 1 && config.isEnabled( 'post-editor' ) ) {
			this.toggleSitesPopover();
			event.preventDefault();
			return;
		}
	},

	onPreload() {
		if ( ! this._preloaded && config.isEnabled( 'post-editor' ) ) {
			this._preloaded = true;
			// preload the post editor chunk
			require.ensure( [ 'post-editor' ], () => {}, 'post-editor' );
		}
	},

	getPopoverPosition() {
		if ( viewport.isMobile() ) {
			return 'bottom';
		}

		if ( this.props.user.isRTL() ) {
			return 'bottom right';
		}

		return 'bottom left';
	},

	render() {
		const classes = classNames( this.props.className );
		const currentSite = this.props.sites.getSelectedSite() || this.props.user.get().primarySiteSlug;
		const newPostPath = paths.newPost( currentSite );

		return (
			<MasterbarItem
				ref={ this.setPostButtonContext }
				url={ newPostPath }
				icon="create"
				onClick={ this.onClick }
				onPreload={ this.onPreload }
				isActive={ this.props.isActive }
				tooltip={ this.props.tooltip }
				className={ classes }
			>
				{ this.props.children }
				<SitesPopover
					visible={ this.state.isShowingPopover }
					context={ this.state.postButtonContext }
					onClose={ this.toggleSitesPopover.bind( this, false ) }
					position={ this.getPopoverPosition() } />
			</MasterbarItem>
		);
	}
} );
