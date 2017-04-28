'use strict';

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const util = require('./util');

function valMap (reg, prop, valMapData) {
	return function valMap (decl) {
		if (reg.test(decl.prop)) {
			const value = postcss.vendor.unprefixed(decl.value);
			return {
				prop: prop,
				value: valMapData[value] || value,
			};
		}
	};
}

function decl2result (decl) {
	const result = unprefixDecl(decl);
	if (!result.prop) {
		result.prop = decl.prop;
	}
	if (!result.value) {
		result.value = decl.value;
	}
	return result;
}

function brotherFirst (reg, brotherProp) {
	return function brotherFirst (decl) {
		if (reg.test(decl.prop)) {
			const brother = getBrotherDecl(decl, brotherProp);
			if (brother) {
				return decl2result(brother);
			}
		}
	};
}

function unprefixFirst (decl) {
	let prop = decl.prop.match(util.rePrefix);
	while (prop) {
		const brother = getBrotherDecl(decl, prop[1]);
		if (brother) {
			return decl2result(brother);
		} else {
			prop = prop[1].match(/^(.+?)-\w+$/);
		}
	}
}

function getBrotherDecl (decl, prop) {
	let result;
	let unprefix;
	if (!decl.parent) {
		return;
	}
	decl.parent.walkDecls(prop, function (decl) {
		if (decl.prop[0] === '-') {
			result = decl;
		} else {
			unprefix = decl;
		}
	});
	return unprefix || result;
}

const ALIGN_CONTENT = {
	'start': 'flex-start',
	'end': 'flex-end',
	'justify': 'space-between',
	'distribute': 'space-around',
};

const RE_BOX_DIRECTION = /^(?:-\w+-)?(?:flex)?box-direction$/i;
const RE_BOX_ORIENT = /^(?:-\w+-)?(?:flex)?box-orient$/i;
const RE_FLEX_FLOW = /^(?:-\w+-)?flex-flow$/i;

const declUnprefixers = [
	brotherFirst(/^(?:-\w+-)?box-flex$/i, /^(?:-\w+-)?flex-grow$/i),
	brotherFirst(/^(?:-\w+-)?box-flex$/i, /^(?:-\w+-)?flex$/i),
	brotherFirst(RE_BOX_ORIENT, RE_FLEX_FLOW),
	brotherFirst(RE_BOX_DIRECTION, RE_FLEX_FLOW),
	valMap(RE_BOX_DIRECTION, 'flex-direction', {
		'lr': 'row',
		'rl': 'row-reverse',
		'tb': 'column',
		'bt': 'column-reverse',
	}),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-pack$/i, 'justify-content', ALIGN_CONTENT),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-line-pack$/i, 'align-content', ALIGN_CONTENT),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-item-align$/i, 'align-self', ALIGN_CONTENT),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-align$/i, 'align-items', ALIGN_CONTENT),
	function breakInside (decl) {
		if (/^(?:-\w+-)?(\w+)-break-(\w+)/i.test(decl.prop)) {
			return {
				prop: 'break-' + RegExp.$2,
				value: decl.value.toLowerCase() === 'avoid' ? 'avoid-' + RegExp.$1 : decl.value,
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
	unprefixFirst,
];

// const PREFIXED_PROP_NAME_MAP = {
// 	'-ms-flex-positive': 'flex-grow',
// 	'-ms-grid-column-align': 'grid-row-align',
// 	'-ms-grid-column-span': 'grid-column',
// 	'-ms-grid-columns': 'grid-template-columns',
// 	'-ms-grid-row-span': 'grid-row-end',
// 	'-ms-grid-rows': 'grid-template-rows',
// 	'-ms-
// };

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
	'flex-preferred-size': 'flex-basis',
	'flex-negative': 'flex-shrink',
	'box-ordinal-group': 'order',
	'flex-order': 'order',
	'flex-positive': 'flex-grow',
};

const PREFIXED_VALUE_NAME_NAME = {
	'-moz-available': 'stretch',
};

const unprefixValue = util.valueUnprefixer([
	require('./unprefixGradient'),
	function autoUnprefix (node, prop) {
		const value = node.value.toLowerCase();
		const unprefixed = PREFIXED_VALUE_NAME_NAME[value] || postcss.vendor.unprefixed(value);
		const data = autoprefixer.data.prefixes[unprefixed];

		if (data && data.props && (data.props[0] === '*' || data.props.indexOf(prop) >= 0)) {
			node.value = unprefixed;
			return node;
		}

	},
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
	prop = postcss.vendor.unprefixed(prop);

	if (PROP_NAME_MAP[prop]) {
		return PROP_NAME_MAP[prop];
	}

	const date = autoprefixer.data.prefixes[prop];

	if (date && !date.selector && !date.props) {
		return prop;
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
	result.value = unprefixValue(decl.value, result.prop || decl.prop);
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
