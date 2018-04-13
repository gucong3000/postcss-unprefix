"use strict";
const postcss = require("postcss");
const unprefixDecl = require("./unprefix").decl;
const util = require("./util");
function walkDecl (decl) {
	if (util.rePrefix.test(decl.prop) || /(^|,|\s)-\w+-.+/i.test(decl.value)) {
		clearDecl(decl);
	}
}

function clearDecl (decl) {
	const rule = decl.parent;
	const prop = postcss.vendor.unprefixed(decl.prop);
	let unprefixed;
	let lastUnprefixed;

	const prefixedDecls = util.getDecls(rule, new RegExp("^-\\w+-" + prop + "$", "i"));

	util.getDecls(rule, unprefixDecl(decl).prop || prop).forEach((decl) => {
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

	prefixedDecls.forEach((decl) => {
		decl.remove();
	});
}

module.exports = walkDecl;
