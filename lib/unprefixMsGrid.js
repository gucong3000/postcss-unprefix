'use strict';
function unprefixMsGrid (decl) {
	let prop = decl.prop.match(/^-ms-grid-(\w+)(?:-(.+))?$/i);
	if (!prop) {
		return;
	}
	const aspect = prop[1].toLowerCase();
	prop = prop[2] && prop[2].toLowerCase();
	let value = decl.value.toLowerCase();
	if (!prop) {
		if (/s$/i.test(aspect)) {
			return {
				prop: 'grid-template-' + aspect,
				value: value,
			};
		} else {
			prop = 'start';
		}
	} else if (prop === 'span') {
		prop = 'end';
		value = 'span ' + value;
	} else if (prop === 'align') {
		return {
			prop: 'align-self',
			value: value.replace(/^(start|end)$/i, 'flex-$1'),
		};
	} else {
		return;
	}

	return {
		prop: ['grid', aspect, prop].join('-'),
		value: value,
	};
}

module.exports = unprefixMsGrid;
