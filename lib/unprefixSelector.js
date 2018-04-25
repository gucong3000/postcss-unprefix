"use strict";
const util = require("./util");
const removeExtraSelector = util.removeExtra(/(.+?)(?:\s*,\s*\1)+/gm);
const pseudoClasses = require("pseudo-classes")();
const pseudoElements = require("pseudo-elements")();
const parser = require("postcss-selector-parser");
const PSEUDO_MAP = {
	"input-placeholder": "placeholder",
	"full-screen": "fullscreen",
};

function unprefixSelector (selector) {
	let fixed;
	selector = parser((selectors) => {
		selectors.walkPseudos((pseudo) => {
			let value = /^(?::+)-\w+-(\w+(-\w+)*)$/.exec(pseudo.value);
			if (!value) {
				return;
			}
			let start;
			value = value[1].toLowerCase();
			value = PSEUDO_MAP[value] || value;
			if (pseudoClasses.indexOf(value) >= 0) {
				start = ":";
			} else if (pseudoElements.indexOf(value) >= 0) {
				start = "::";
			} else {
				return pseudo;
			}
			pseudo.value = start + value;
			fixed = true;
		});
	}).processSync(selector);

	return {
		fixed: fixed || false,
		toString: function () {
			return removeExtraSelector(selector.toString());
		},
	};
}

module.exports = unprefixSelector;
