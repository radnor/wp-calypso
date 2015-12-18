var SSR_READY = '/** @ssr-ready **/';

function PragmaCheckPlugin( options ) {
	this.options = options || {};
}

function scanDependencies( module, compilation ) {
	if ( ! module.dependencies ) {
		return;
	}

	module.dependencies.forEach( function( dep ) {
		if ( dep.module && /babel-loader/.test( dep.module.request ) &&
				dep.module._source &&
				dep.module._source._value.indexOf( SSR_READY ) === -1 ) {
			compilation.errors.push( module.rawRequest + ': ' + dep.module.rawRequest + ' is not SSR ready!' );
		}

		if ( dep.module && dep.module.dependencies ) {
			scanDependencies( dep.module.dependencies );
		}
	} );
}

PragmaCheckPlugin.prototype.apply = function( compiler ) {
	compiler.plugin( 'compilation', function( compilation ) {
		compilation.plugin( 'optimize-modules', function( modules ) {
			modules.forEach( function( module ) {
				if ( module._source && ~ module._source._value.indexOf( SSR_READY ) ) {
					scanDependencies( module, compilation );
				}
			} );
		} );
	} );
};

module.exports = PragmaCheckPlugin;
