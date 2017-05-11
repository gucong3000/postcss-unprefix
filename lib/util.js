'use strict';
const rePrefix = /^-\w+-(\w+(?:-\w+)*)$/i;
const valueParser = require('postcss-value-parser');
const removeExtraValue = removeExtra(/\b([a-z]+?\w+(?:-\w+)*(?:\s+[^,]+)?)(?:\s*,\s*(?:-\w+-)?\1)+/igm);

function valueUnprefixer (valueUnprefixers) {
	function unprefixValueNode (value, prop) {
		let fixed;
		value.nodes.forEach(function (node) {
			if (node.type === 'div') {
				return false;
			}
			if (rePrefix.test(node.value)) {
				fixed = valueUnprefixers.some(function (unprefixer) {
					return unprefixer(node, prop);
				}) || fixed;
			} else if (node.nodes) {
				fixed = unprefixValueNode(node, prop) || fixed;
			}
		});
		return fixed || false;
	}

	function unprefixValue (value, prop) {
		value = valueParser(value);

		if (unprefixValueNode(value, prop.toLowerCase())) {
			return removeExtraValue(valueParser.stringify(value));
		}
	}

	return unprefixValue;
}

// 各种长度单位与deg之间的换算关系 https://developer.mozilla.org/zh-CN/docs/Web/CSS/length
const lengthUnitMap = {
	'in': 96,
	ch: 6,
	cm: 37.79527559055118,
	em: 12,
	ex: 5.4376,
	mm: 3.7795275590551185,
	pc: 16,
	pt: 1.3333333333333333,
	q: 0.9448818897637796,
	rem: 16,
	vh: 960,
	vm: 640,
	vmax: 960,
	vmin: 640,
	vw: 640,
	px: 1,
};

function length2px (length, failback) {
	length = length && /^((?:\d*\.)?\d+)([a-z]+?)$/i.exec(length);
	let unit;
	let value;

	if (!length || !(unit = lengthUnitMap[length[2].toLowerCase()]) || isNaN(value = parseFloat(length[1]))) {
		return failback;
	}
	return parseFloat((value * unit).toFixed(8));
}

function getDecls (parent, prop) {
	const result = [];
	const unprefix = [];
	if (!parent) {
		return result;
	}

	if (typeof prop === 'string') {
		prop = new RegExp('^' + prop + '$', 'i');
	}
	parent.walkDecls(prop, function (decl) {
		if (decl.parent !== parent) {
			return;
		}
		if (decl.prop[0] === '-') {
			result.push(decl);
		} else {
			unprefix.push(decl);
		}
	});
	return result.concat(unprefix);
}

function removeExtra (regexp) {
	function removeExtra (string) {
		let fixed;
		string = string.replace(regexp, function (s, content) {
			fixed = true;
			return content;
		});
		if (fixed) {
			string = removeExtra(string);
		}
		return string;
	}
	return removeExtra;
}

module.exports = {
	rePrefix: rePrefix,
	removeExtra: removeExtra,
	length2px: length2px,
	valueUnprefixer: valueUnprefixer,
	getDecls: getDecls,
};
