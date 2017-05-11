'use strict';
const util = require('./util');
const removeExtraSelector = util.removeExtra(/(.+?)(?:\s*,\s*\1)+/gm);
const PSEUDO_MAP = {
	'input-placeholder': '::placeholder',
	'placeholder': '::placeholder',
	'full-screen': ':fullscreen',
};

const parser = require('postcss-selector-parser');
function unprefixSelector (selector) {
	let fixed;
	selector = parser(function unprefixSelector (selectors) {
		selectors.walk(function (selector) {
			const value = /^(\:+)-\w+-(\w+(-\w+)*)$/.exec(selector.value);
			if (!value) {
				return;
			}
			fixed = true;
			const pseudo = value[2].toLowerCase();
			selector.value = PSEUDO_MAP[pseudo] || (value[1] + pseudo);
		});
	}).process(selector);

	return {
		fixed: fixed,
		toString: function () {
			return removeExtraSelector(selector.result);
		},
	};
}

module.exports = unprefixSelector;
