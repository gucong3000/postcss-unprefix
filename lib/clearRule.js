'use strict';
const PSEUDO_MAP = {
	'input-placeholder': '::placeholder',
	'placeholder': '::placeholder',
	'full-screen': ':fullscreen',
};

function unprefixSelector (selector) {
	let fixed;
	selector = selector.replace(/(\:+)-\w+-(\w+(-\w+)*)/g, function (s, colon, pseudo) {
		fixed = true;
		pseudo = pseudo.toLowerCase();
		return PSEUDO_MAP[pseudo] || (colon + pseudo);
	});
	if (fixed) {
		return selector;
	}
}

function clearRule (rule) {
	const parent = rule.parent;
	const selector = unprefixSelector(rule.selector);
	if (!selector) {
		return;
	}
	const prefixedDecls = [];
	let unprefixed;
	parent.walkRules(function (rule) {
		if (rule.parent !== parent) {
			return;
		}
		if (rule.selector === selector) {
			unprefixed = rule;
		} else if (unprefixSelector(rule.selector) === selector) {
			prefixedDecls.push(rule);
		}
	});
	if (!unprefixed) {
		prefixedDecls.pop().selector = selector;
	}
	prefixedDecls.forEach(function (decl) {
		decl.remove();
	});
}

module.exports = clearRule;
