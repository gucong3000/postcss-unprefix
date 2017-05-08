'use strict';
const util = require('./util');
const unprefix = require('./unprefix');
const removeExtraParens = util.removeExtra(/\(\s*(\(.+?\))\s*\)/gm);
const removeExtraDecls = util.removeExtra(/(\(.+?\))\s*or\s*\1/igm);

function unprefixSupports (params) {
	let fixed;
	params = params.replace(/\(\s*((?:-\w+-)?\w+(?:-\w+)*)\s*\:\s*(.+?)\s*\)/igm, function (s, prop, value) {
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

	params = params.replace(/^\w+(?:\s+\w+)*\s*/, function (prefix) {
		mediaType = prefix;
		return '';
	}).split(/\s*,\s*/).filter(function (param) {
		param = param.match(/^\(\s*(-\w+-)?(\w+(?:-\w+)*)\s*(?:\:\s*(.+?)\s*)?\)$/);
		if (!param) {
			return true;
		}
		if (/^(\w+-)?device-pixel-ratio$/i.test(param[2])) {
			devicePixelRatio[RegExp.$1.toLowerCase() + 'resolution'] = param[3];
			fixed = true;
		} else {
			const prop = (param[1] || '') + param[2];
			const value = param[3];
			rule[prop] = value;
		}
	});

	if (!fixed) {
		return;
	}

	for (const prop in devicePixelRatio) {
		if (prop in rule) {
			continue;
		}
		let value = devicePixelRatio[prop];
		try {
			value = eval(value);
		} catch (ex) {
			rule[prop] = value;
			continue;
		}
		rule[prop] = value + 'dppx';
	}
	const props = Object.keys(rule);
	return {
		toString: function () {
			return mediaType + params.concat(props.map(function (prop) {
				if (rule[prop]) {
					return '(' + prop + ': ' + rule[prop] + ')';
				} else {
					return '(' + prop + ')';
				}
			})).join(', ');
		},
		valueOf: function () {
			return mediaType + params.concat(props.sort().map(function (prop) {
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
