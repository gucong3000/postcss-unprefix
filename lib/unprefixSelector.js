'use strict';
const util = require('./util');
const removeExtraSelector = util.removeExtra(/(.+?)(?:\s*,\s*\1)+/gm);
const pseudoClasses = require('pseudo-classes')();
const pseudoElements = require('pseudo-elements')();
const parser = require('postcss-selector-parser');

function unprefixSelector (selector) {
	let fixed;
	selector = parser(function unprefixSelector (selectors) {
		selectors.walk(function (selector) {
			const value = /^(\:+)-\w+-(\w+(-\w+)*)$/.exec(selector.value);
			if (!value) {
				return;
			}
			const pseudo = value[2].toLowerCase();
			if (pseudoClasses.indexOf(pseudo) >= 0) {
				selector.value = ':' + pseudo; 
			} else if (pseudoElements.indexOf(pseudo) >= 0) {
				selector.value = '::' + pseudo; 
			} else if (/^(?:input-)?placeholder$/.test(pseudo)) {
				selector.value = '::placeholder';
			} else if (/^full-?screen$/.test(pseudo)) {
				selector.value = ':fullscreen';
			} else {
				return;
			}
			fixed = true;
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
