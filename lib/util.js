'use strict';
const rePrefix = /^-\w+-(\w+(?:-\w+)*)$/i;
const valueParser = require('postcss-value-parser');

function valueUnprefixer (valueUnprefixers) {
	function unprefixValueNode (value, prop) {
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
module.exports = {
	rePrefix: rePrefix,
	valueUnprefixer: valueUnprefixer,
};
