'use strict';

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const util = require('./util');

function valMap (reg, prop, valMapData) {
	return function valMap (decl) {
		if (reg.test(decl.prop)) {
			const value = postcss.vendor.unprefixed(decl.value);
			if (valMapData[value]) {
				return {
					prop: prop,
					value: valMapData[value],
				};
			}
		}
	};
}

function brotherFirst (reg, brotherProp) {
	return function brotherFirst (decl) {
		if (reg.test(decl.prop)) {
			const brother = getBrotherDecl(decl, brotherProp);
			if (brother) {
				const result = unprefixDecl(brother);
				if (!result.prop) {
					result.prop = brother.prop;
				}
				if (!result.value) {
					result.value = brother.value;
				}
				return result;
			}
		}
	};
}

function getBrotherDecl (decl, prop) {
	let result;
	let unprefix;
	decl.parent.walkDecls(prop, function (decl) {
		if (decl.prop[0] === '-') {
			result = decl;
		} else {
			unprefix = decl;
		}
	});
	return unprefix || result;
}

const RE_BOX_DIRECTION = /^(?:-\w+-)?(?:flex)?box-direction$/i;
const RE_BOX_ORIENT = /^(?:-\w+-)?(?:flex)?box-orient$/i;
const RE_FLEX_FLOW = /^(?:-\w+-)?flex-flow$/i;
const RE_ORDER = /^(?:-\w+-)?order$/i;

const declUnprefixers = [
	valMap(/^(?:-\w+-)?(?:flex)?box-direction$/i, 'flex-direction', {
		'lr': 'row',
		'rl': 'row-reverse',
		'tb': 'column',
		'bt': 'column-reverse',
	}),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-pack$/i, 'justify-content', {
		'start': 'flex-start',
		'end': 'flex-end',
		'justify': 'space-between',
	}),
	brotherFirst(/^(?:-\w+-)?box-flex$/i, /^(?:-\w+-)?flex-grow$/i),
	brotherFirst(/^(?:-\w+-)?box-flex$/i, /^(?:-\w+-)?flex$/i),
	brotherFirst(/^(?:-\w+-)?box-ordinal-group$/i, RE_ORDER),
	brotherFirst(/^-ms-flex-order$/i, RE_ORDER),
	brotherFirst(RE_BOX_ORIENT, RE_FLEX_FLOW),
	brotherFirst(RE_BOX_DIRECTION, RE_FLEX_FLOW),
	function alignItems (decl) {
		if (/^(?:-\w+-)?(?:flex)?box-align$/i.test(decl.prop) || /^-ms-flex-align$/i.test(decl.prop)) {
			return {
				prop: 'align-items',
				value: decl.value.replace(/^(?:-\w+-)?(start|end)$/, 'flex-$1'),
			};
		}
	},
	function breakInside (decl) {
		if (/^(?:-\w+-)?(\w+)-break-(\w+)/i.test(decl.prop)) {
			return {
				prop: 'break-' + RegExp.$2,
				value: decl.value === 'avoid' ? RegExp.$1 + '-avoid' : decl.value,
			};
		}
	},
	function boxOrient (decl) {
		if (RE_BOX_ORIENT.test(decl.prop)) {
			const boxOrient = {
				horizontal: 'row',
				vertical: 'column',
			}[decl.value.toLowerCase()];

			if (!boxOrient) {
				return;
			}
			let boxDirection = getBrotherDecl(decl, RE_BOX_DIRECTION);
			if (boxDirection && boxDirection.value === 'reverse') {
				boxDirection = '-reverse';
			} else {
				boxDirection = '';
			}
			return {
				prop: 'flex-direction',
				value: boxOrient + boxDirection,
			};
		}
	},
	function boxDirection (decl) {
		if (RE_BOX_DIRECTION.test(decl.prop)) {
			let boxDirection = decl.value.toLowerCase();
			if (boxDirection === 'reverse') {
				boxDirection = '-reverse';
			} else if (boxDirection === 'normal') {
				boxDirection = '';
			} else {
				return;
			}

			let boxOrient = getBrotherDecl(decl, RE_BOX_ORIENT);
			if (boxOrient && boxOrient.value === 'vertical') {
				boxOrient = 'column';
			} else {
				boxOrient = 'row';
			}

			return {
				prop: 'flex-direction',
				value: boxOrient + boxDirection,
			};
		}
	},
	function displayFlex (decl) {
		if (/^(?:-\w+-)?display$/i.test(decl.prop)) {
			let value;
			if (/^(?:-\w+-)?(inline-)?((?:flex)?(?:box)?)$/i.test(decl.value) && RegExp.$2) {
				value = RegExp.$1 + 'flex';
			} else if (/^-\w+-((inline-)?grid)$/i.test(decl.value)) {
				value = RegExp.$1;
			} else if (/^display$/i.test(decl.prop)) {
				return;
			}

			return {
				prop: 'display',
				value: value || decl.value,
			};
		}
	},
	function imageRendering (decl) {
		let value;
		if (/^(?:-\w+-)?image-rendering$/i.test(decl.prop)) {
			if (/^-\w+-optimize-contrast$/i.test(decl.value)) {
				value = 'crisp-edges';
			} else if ((value = decl.value.match(util.rePrefix))) {
				value = value[1];
			} else {
				return;
			}
		} else if (/^-ms-interpolation-mode$/i.test(decl.prop) && /^nearest-neighbor$/i.test(decl.value)) {
			value = 'pixelated';
		} else {
			return;
		}
		return {
			prop: 'image-rendering',
			value: value,
		};
	},
];

const PREFIXED_PROP_NAME_MAP = {
	'-ms-flex-positive': 'flex-grow',
	'-ms-grid-column-align': 'grid-row-align',
	'-ms-grid-column-span': 'grid-column',
	'-ms-grid-columns': 'grid-template-columns',
	'-ms-grid-row-span': 'grid-row-end',
	'-ms-grid-rows': 'grid-template-rows',
	'-ms-flex-item-align': 'align-self',
	'-ms-flex-pack': 'justify-content',
	'-ms-flex-line-pack': 'align-content',
	'-ms-flex-preferred-size': 'flex-basis',
	'-ms-flex-negative': 'flex-shrink',
};

const PROP_NAME_MAP = {
	'border-radius-bottomleft': 'border-bottom-left-radius',
	'border-radius-bottomright': 'border-bottom-right-radius',
	'border-radius-topleft': 'border-top-left-radius',
	'border-radius-topright': 'border-top-right-radius',

	'border-after': 'border-block-end',
	'border-before': 'border-block-start',
	'border-end': 'border-inline-end',
	'border-start': 'border-inline-start',

	'margin-after': 'margin-block-end',
	'margin-before': 'margin-block-start',
	'margin-end': 'margin-inline-end',
	'margin-start': 'margin-inline-start',

	'padding-after': 'padding-block-end',
	'padding-before': 'padding-block-start',
	'padding-end': 'padding-inline-end',
	'padding-start': 'padding-inline-start',

	'mask-box-image': 'mask-border',
	'mask-box-image-outset': 'mask-border-outset',
	'mask-box-image-repeat': 'mask-border-repeat',
	'mask-box-image-slice': 'mask-border-slice',
	'mask-box-image-source': 'mask-border-source',
	'mask-box-image-width': 'mask-border-width',

	'box-align': 'align-items',
	'box-pack': 'justify-content',
	// 'box-ordinal-group': 'order',
	// 'box-flex': 'flex',
};

const unprefixValue = util.valueUnprefixer([
	require('./unprefixGradient'),
	function unprefixPropInValue (node, prop) {
		if (/^(?:-\w+-)?transition(?:-property)?$/.test(prop) || node.type === 'function') {
			const prefixed = unprefixProp(node.value);
			if (prefixed) {
				node.value = prefixed;
				return node;
			}
		}
	},
]);

function unprefixProp (prop) {
	if (PREFIXED_PROP_NAME_MAP[prop]) {
		return PREFIXED_PROP_NAME_MAP[prop];
	}
	prop = postcss.vendor.unprefixed(prop);
	if (autoprefixer.data.prefixes[prop]) {
		return prop;
	}
	if (PROP_NAME_MAP[prop]) {
		return PROP_NAME_MAP[prop];
	}
}

function unprefix (decl) {
	let result;
	if (declUnprefixers.some(function (unprefixer) {
		result = unprefixer(decl);
		return result;
	})) {
		return result;
	}
	result = {};
	result.prop = unprefixProp(decl.prop);
	result.value = unprefixValue(decl.value, decl.prop);
	return result;
}

function unprefixDecl (decl) {
	const result = unprefix (decl);
	result.replace = function () {
		if (result.prop) {
			decl.prop = result.prop;
		}
		if (result.value) {
			decl.value = result.value;
		}
	};
	return result;
}

module.exports = {
	decl: unprefixDecl,
	value: unprefixValue,
	prop: unprefixProp,
};
