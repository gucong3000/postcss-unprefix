"use strict";
const unprefixSelector = require("./unprefixSelector");

function clearRule (rule) {
	let selector = unprefixSelector(rule.selector);
	if (!selector.fixed) {
		return;
	}
	const prefixedDecls = [];
	let unprefixed;
	selector = selector.toString();
	const parent = rule.parent;
	parent.walkRules((rule) => {
		if (rule.parent !== parent) {
			return;
		}
		if (rule.selector === selector) {
			unprefixed = rule;
		} else if (unprefixSelector(rule.selector).toString() === selector) {
			prefixedDecls.push(rule);
		}
	});
	if (!unprefixed) {
		prefixedDecls.pop().selector = selector;
	}
	prefixedDecls.forEach((decl) => {
		decl.remove();
	});
}

module.exports = clearRule;
