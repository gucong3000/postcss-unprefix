'use strict';
const rePrefix = require('./util').rePrefix;
const unprefixParam = require('./unprefixParam');

function walkAtRule (atRule) {
	clearAtRule(atRule.parent, atRule);
}

function clearAtRule (parent, atRule) {
	const nameMatch = atRule.name.match(rePrefix);
	const name = nameMatch ? nameMatch[1] : atRule.name;
	let params = unprefixParam(atRule.params, name);
	if (!nameMatch && !params) {
		return;
	}

	params = params || atRule.params;

	if (atRule.name === 'media') {
		console.log(params);
	}

	const prefixedAtRule = [];
	let unprefixed;

	parent.walkAtRules(new RegExp('^(?:-\\w+-)?' + name + '$', 'i'), function (atRule) {
		if (atRule.name === name && atRule.params === params) {
			unprefixed = atRule;
		} else if (atRule.params === params || unprefixParam(atRule.params, name) === params) {
			prefixedAtRule.push(atRule);
		}
	});

	if (!unprefixed) {
		unprefixed = prefixedAtRule.pop();
		unprefixed.name = name;
		unprefixed.params = params;
	}
	prefixedAtRule.forEach(function (atRule) {
		atRule.remove();
	});
}

module.exports = function (css) {
	css.walkAtRules(walkAtRule);
};
