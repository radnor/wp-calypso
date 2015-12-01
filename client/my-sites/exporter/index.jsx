/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { compose } from 'lodash';

/**
 * Internal dependencies
 */
import Exporter from './exporter';
import { shouldShowProgress } from 'state/site-settings/exporter/selectors';
import { toggleSection, startExport } from 'state/site-settings/exporter/actions';

function mapStateToProps( state, ownProps ) {
	return {
		site: ownProps.site,
		advancedSettings: state.siteSettings.exporter.ui.toJS().advancedSettings,
		shouldShowProgress: shouldShowProgress( state )
	};
}

function mapDispatchToProps( dispatch ) {
	return {
		toggleSection: compose( dispatch, toggleSection ),
		startExport: () => startExport()( dispatch )
	};
}

export default connect( mapStateToProps, mapDispatchToProps )( Exporter );
