import { States } from './constants.js';

/**
 * Indicates whether an export activity is in progress.
 *
 * @param  {Object} state    Global state tree
 * @return {boolean}         true if activity is in progress
 */
export function shouldShowProgress( state ) {
	const exportingState = state.siteSettings.exporter.ui.get( 'exportingState' );

	return ( exportingState === States.STARTING || exportingState === States.EXPORTING );
}
