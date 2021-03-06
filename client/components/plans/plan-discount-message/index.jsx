/**
 * External dependencies
 */
var React = require( 'react' );

/**
 * Internal dependencies
 */
var productsValues = require( 'lib/products-values' );

module.exports = React.createClass( {
	displayName: 'PlanDiscountMessage',

	showMostPopularMessage: function() {
		return (
			this.props.showMostPopularMessage &&
			productsValues.isPremium( this.props.plan ) &&
			this.props.plan.product_id !== ( this.props.site && this.props.site.plan.product_id )
		);
	},

	mostPopularPlan: function() {
		var hasBusiness = this.props.site && productsValues.isBusiness( this.props.site.plan );

		return (
			hasBusiness ? null : <div className="plan-discount-message">{ this.translate( 'Our most popular plan' ) }</div>
		);
	},

	planHasDiscount: function() {
		return this.props.sitePlan && this.props.sitePlan.rawDiscount > 0;
	},

	planDiscountMessage: function() {
		var message = this.translate( 'Get %(discount)s off your first year', {
			args: { discount: this.props.sitePlan.formattedDiscount }
		} );

		return (
			<span className="plan-discount-message">{ message }</span>
		);
	},

	render: function() {
		if ( this.showMostPopularMessage() ) {
			return this.mostPopularPlan();
		}
		return false;
	}
} );
