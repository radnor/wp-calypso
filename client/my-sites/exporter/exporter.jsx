/**
 * External dependencies
 */
import React, { PropTypes } from 'react';

/**
 * Internal dependencies
 */
import FoldableCard from 'components/foldable-card';
import AdvancedSettings from 'my-sites/exporter/advanced-settings';
import SpinnerButton from './spinner-button';

export default React.createClass( {
	displayName: 'Exporter',

	propTypes: {
		startExport: PropTypes.func.isRequired,
		toggleSection: PropTypes.func.isRequired,

		shouldShowProgress: PropTypes.bool.isRequired,
		advancedSettings: PropTypes.shape( {
			posts: PropTypes.object,
			pages: PropTypes.object,
			feedback: PropTypes.object
		} ).isRequired
	},

	render: function() {
		const { toggleSection, startExport } = this.props;
		const { advancedSettings, shouldShowProgress } = this.props;

		return (
			<div className="exporter">
				<FoldableCard
					header={
						<div>
							<h1 className="exporter__title">
								{ this.translate( 'Export your content' ) }
							</h1>
							<h2 className="exporter__subtitle">
								{ this.translate( 'Or select specific content items to export' ) }
							</h2>
						</div>
					}
					summary={
						<SpinnerButton
							className="exporter__export-button"
							loading={ shouldShowProgress }
							isPrimary={ true }
							onClick={ startExport }
							text={ this.translate( 'Export' ) }
							loadingText={ this.translate( 'Exporting…' ) } />
					}
					>
					<AdvancedSettings
						{ ...advancedSettings }
						shouldShowProgress={ shouldShowProgress }
						onToggleFieldset={ toggleSection }
						onClickExport={ startExport }
					/>
				</FoldableCard>
			</div>
		);
	}
} );
