'use strict';
const PSEUDO_MAP = {
	'input-placeholder': '::placeholder',
	'placeholder': '::placeholder',
	'full-screen': ':fullscreen',
};

function unprefixSelector (selector) {
	return selector.replace(/(\:+)-\w+-(\w+(-\w+)*)/g, function (s, colon, pseudo) {
		pseudo = pseudo.toString();
		return PSEUDO_MAP[pseudo] || (colon + pseudo);
	});
}

function walkRule (rule) {
	clearRule(rule.parent, unprefixSelector(rule.selector));
}

function clearRule (parent, selector) {
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

module.exports = function (css) {
	css.walkRules(/\:+-\w+-\w+/, walkRule);
};
