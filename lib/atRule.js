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
	const paramsValue = params.valueOf();

	const prefixedAtRule = [];
	let unprefixed;

	parent.walkAtRules(new RegExp('^(?:-\\w+-)?' + name + '$', 'i'), function (atRule) {
		const atRuleParams = unprefixParam(atRule.params, name, true) || atRule.params;
		if (atRuleParams.valueOf() !== paramsValue) {
			return;
		}
		if (atRule.name === name && !/\(-\w+-/.test(atRule.params)) {
			unprefixed = atRule;
		} else {
			prefixedAtRule.push(atRule);
		}
	});

	if (!unprefixed) {
		unprefixed = prefixedAtRule.pop();
		if (unprefixed) {
			unprefixed.name = name;
			unprefixed.params = params.toString();
		} else {
			return;
		}
	}
	prefixedAtRule.forEach(function (atRule) {
		atRule.remove();
	});
}

module.exports = function (css) {
	css.walkAtRules(walkAtRule);
};
