'use strict';
const util = require('./util');
const unprefix = require('./unprefix');
const removeExtraParens = util.removeExtra(/\(\s*(\(.+?\))\s*\)/gm);
const removeExtraDecls = util.removeExtra(/(\(.+?\))\s*or\s*\1/igm);

function unprefixSupports (params) {
	let fixed;
	params = params.replace(/\(\s*((?:-\w+-)?\w+(?:-\w+)*)\s*:\s*(.+?)\s*\)/igm, (s, prop, value) => {
		const result = unprefix.decl({
			prop: prop,
			value: value,
		});
		if (result.prop || result.value) {
			fixed = true;
		}
		return '(' + (result.prop || prop) + ': ' + (result.value || value) + ')';
	});
	if (!fixed) {
		return;
	}
	params = removeExtraParens(removeExtraDecls(params));
	return {
		toString: function () {
			return params;
		},
		valueOf: function () {
			return params.replace(/\s+/gm, ' ');
		},
	};
}

function unprefixMedia (params) {
	const rule = {};
	const devicePixelRatio = {};
	let fixed;

	let mediaType = '';

	params = params.replace(/^\w+(?:\s+\w+)*\s*/, (prefix) => {
		mediaType = prefix;
		return '';
	}).split(/\s*,\s*/).filter((param) => {
		param = /^\(\s*(\S+)\s*(?::\s*(.+?)\s*)?\)$/.exec(param);
		if (!param) {
			return true;
		}
		const prop = /^(?:-\w+-)?((?:\w+-)*?)device-pixel-ratio$/i.exec(param[1]);
		if (prop) {
			const key = prop[1].toLowerCase() + 'resolution';
			if (!rule[key]) {
				rule[key] = null;
			}
			devicePixelRatio[key] = param[2];
			fixed = true;
		} else {
			rule[param[1].toLowerCase()] = param[2];
		}
	});

	if (!fixed) {
		return;
	}

	for (const prop in devicePixelRatio) {
		if (rule[prop]) {
			continue;
		}
		let value = devicePixelRatio[prop];
		try {
			// eslint-disable-next-line no-eval
			value = eval.call(0, value);
		} catch (ex) {
			rule[prop] = value;
			continue;
		}
		rule[prop] = value + 'dppx';
	}

	return {
		toString: function () {
			return mediaType + params.concat(Object.keys(rule).map((prop) => {
				if (rule[prop]) {
					return '(' + prop + ': ' + rule[prop] + ')';
				} else {
					return '(' + prop + ')';
				}
			})).join(', ');
		},
		valueOf: function () {
			return mediaType + params.concat(Object.keys(rule).sort().map((prop) => {
				let value = rule[prop];
				if (/\d+dppx$/i.test(value)) {
					value = parseFloat(value) * 96 + 'dpi';
				} else {
					value = util.length2px(value, value);
				}

				return '(' + prop + ': ' + value + ')';
			})).join(', ');
		},
	};
}

module.exports = function (params, name) {
	if (/^media$/i.test(name)) {
		return unprefixMedia(params.toLowerCase());
	}
	if (/^supports$/i.test(name)) {
		return unprefixSupports(params.toLowerCase());
	}
};
