"use strict";
const rePrefix = require("./util").rePrefix;
const unprefixParam = require("./unprefixParam");

function clearAtRule (atRule) {
	const parent = atRule.parent;
	const nameMatch = rePrefix.exec(atRule.name);
	const name = nameMatch ? nameMatch[1] : atRule.name;
	let params = unprefixParam(atRule.params, name);
	if (!nameMatch && !params) {
		return;
	}

	params = params || atRule.params;
	const paramsValue = params.valueOf();

	const prefixedAtRule = [];
	let unprefixed;

	parent.walkAtRules(new RegExp("^(?:-\\w+-)?" + name + "$", "i"), (atRule) => {
		if (atRule.parent !== parent) {
			return;
		}
		const atRuleFixedParams = unprefixParam(atRule.params, name);
		if ((atRuleFixedParams || atRule.params).valueOf() !== paramsValue) {
			return;
		}

		if (atRule.name[0] === "-" || atRuleFixedParams) {
			prefixedAtRule.push(atRule);
		} else {
			unprefixed = atRule;
		}
	});

	if (!unprefixed) {
		unprefixed = prefixedAtRule.pop();
		unprefixed.name = name;
		unprefixed.params = params.toString();
	}
	prefixedAtRule.forEach((atRule) => {
		atRule.remove();
	});
}

module.exports = clearAtRule;
