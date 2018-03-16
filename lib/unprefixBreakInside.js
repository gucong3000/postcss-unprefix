'use strict';
const util = require('./util');

function unprefixFlexDirection (decl) {
	const prop = /^(?:-\w+-)?(page|column)-break-(after|before|inside)/i.exec(decl.prop);
	if (prop) {
		const box = prop[2].toLowerCase();
		util.getDecls(decl.parent, 'page-break-' + box).forEach((decl) => {
			decl.remove();
		});

		let value = decl.value.toLowerCase();
		if (value === 'avoid') {
			value += '-' + prop[1].toLowerCase();
		}

		return {
			prop: 'break-' + box,
			value: value,
		};
	}
}
module.exports = unprefixFlexDirection;
