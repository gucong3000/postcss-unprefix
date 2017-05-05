'use strict';
const rePrefix = /^-\w+-(\w+(?:-\w+)*)$/i;
const valueParser = require('postcss-value-parser');

function valueUnprefixer (valueUnprefixers) {
	function unprefixValueNode (value, prop) {
		prop = prop.toLowerCase();
		let fixed;
		value.nodes.forEach(function (node) {
			if (node.type === 'div') {
				return false;
			}
			if (rePrefix.test(node.value)) {
				fixed = fixed || valueUnprefixers.some(function (unprefixer) {
					return unprefixer(node, prop);
				});
			} else if (node.nodes) {
				fixed = fixed || unprefixValueNode(node, prop);
			}
		});
		return fixed || false;
	}

	function unprefixValue (value, prop) {
		value = valueParser(value);

		if (unprefixValueNode(value, prop)) {
			return valueParser.stringify(value).replace(/(.+?)(\s*,\s*\1)+/igm, '$1');
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
	length = length && length.match(/^((?:\d*\.)?\d+)(\w+?)$/);
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
	parent.walkDecls(prop, function (decl) {
		if (decl.prop[0] === '-') {
			result.push(decl);
		} else {
			unprefix.push(decl);
		}
	});
	return result.concat(unprefix);
}

module.exports = {
	rePrefix: rePrefix,
	length2px: length2px,
	valueUnprefixer: valueUnprefixer,
	getDecls: getDecls,
};
