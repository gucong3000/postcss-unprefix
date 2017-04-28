'use strict';
const util = require('./util');
const unprefix = require('./unprefix');
function unprefixMedia (params) {
	const rule = {};
	const devicePixelRatio = {};
	let fixed;

	let mediaType = '';

	params = params.replace(/^\w+(?:\s+\w+)*\s*/, function (prefix) {
		mediaType = prefix;
		return '';
	}).split(/\s*,\s*/).filter(function (param) {
		param = param.match(/^\(\s*(-\w+-)?(\w+(?:-\w+)*)\s*\:\s*(.+?)\s*\)$/);
		if (!param) {
			return true;
		}
		if (/^(\w+-)?device-pixel-ratio$/i.test(param[2])) {
			devicePixelRatio[RegExp.$1 + 'resolution'] = param[3];
			fixed = true;
		} else {
			const prop = param[2];
			const value = param[3];
			rule[prop] = value;
			if (param[1]) {
				fixed = true;
			}
		}
	});

	if (fixed) {
		for (const prop in devicePixelRatio) {
			if (prop in rule) {
				continue;
			}
			let value;
			try {
				value = eval(devicePixelRatio[prop]);
			} catch (ex) {
				continue;
			}
			rule[prop] = value + 'dppx';
		}
		const props = Object.keys(rule);
		return {
			toString: function () {
				return mediaType + params.concat(props.map(function (prop) {
					return '(' + prop + ': ' + rule[prop] + ')';
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
}

function unprefixSupports (params) {
	const newParams = params
		.replace(/\(\s*((?:-\w+-)?\w+(?:-\w+)*)\s*\:\s*(.+?)\s*\)/igm, function (s, prop, value) {
			const result = unprefix.decl({
				prop: prop,
				value: value,
			});
			return '(' + (result.prop || prop) + ': ' + (result.value || value) + ')';
		})
		.replace(/\(\s*(\(.+?\))\s*or\s*\1\s*\)/igm, '$1');
	if (newParams !== params) {
		return unprefixSupports(newParams) || newParams;
	}
}

module.exports = function (params, name) {
	if (/^media$/i.test(name)) {
		return unprefixMedia(params.toLowerCase());
	}
	if (/^supports$/i.test(name)) {
		return unprefixSupports(params.toLowerCase());
	}
};
