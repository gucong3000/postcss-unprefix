'use strict';
const util = require('./util');
const removeExtraSelector = util.removeExtra(/(.+?)(?:\s*,\s*\1)+/gm);
const pseudoClasses = require('pseudo-classes')();
const pseudoElements = require('pseudo-elements')();
const parser = require('postcss-selector-parser');
const PSEUDO_MAP = {
	'input-placeholder': 'placeholder',
	'full-screen': 'fullscreen',
};

function unprefixSelector (selector) {
	let fixed;
	selector = parser(function unprefixSelector (selectors) {
		selectors.walk(function (selector) {
			const value = /^(?::+)-\w+-(\w+(-\w+)*)$/.exec(selector.value);
			if (!value) {
				return;
			}
			let start;
			let pseudo = value[1].toLowerCase();
			pseudo = PSEUDO_MAP[pseudo] || pseudo;
			if (pseudoClasses.indexOf(pseudo) >= 0) {
				start = ':';
			} else if (pseudoElements.indexOf(pseudo) >= 0) {
				start = '::';
			} else {
				return;
			}
			selector.value = start + pseudo;
			fixed = true;
		});
	}).processSync(selector);

	return {
		fixed: fixed,
		toString: function () {
			return removeExtraSelector(selector);
		},
	};
}

module.exports = unprefixSelector;
