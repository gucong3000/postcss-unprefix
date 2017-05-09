'use strict';
const postcss = require('postcss');
const unprefixDecl = require('./unprefix').decl;
const rePrefix = require('./util').rePrefix;
function walkDecl (decl) {
	if (rePrefix.test(decl.prop) || /(^|,|\s)-\w+-.+/i.test(decl.value)) {
		clearDecl(decl);
	}
}

function clearDecl (decl) {
	const rule = decl.parent;
	const prop = postcss.vendor.unprefixed(decl.prop);
	const prefixedDecls = [];
	let unprefixed;
	let lastUnprefixed;

	rule.walkDecls(new RegExp('^-\\w+-' + prop + '$', 'i'), function (decl) {
		if (decl.parent !== rule) {
			return;
		}
		prefixedDecls.push(decl);
	});

	rule.walkDecls(unprefixDecl(decl).prop || prop, function (decl) {
		if (decl.parent !== rule) {
			return;
		}
		lastUnprefixed = unprefixDecl(decl);
		if (lastUnprefixed.value) {
			prefixedDecls.push(decl);
		} else {
			unprefixed = decl;
		}
	});

	if (!unprefixed) {
		const lastDecl = prefixedDecls.pop();
		(lastUnprefixed || unprefixDecl(lastDecl)).replace();
	}

	prefixedDecls.forEach(function (decl) {
		decl.remove();
	});
}

module.exports = walkDecl;
