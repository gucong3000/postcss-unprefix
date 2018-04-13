"use strict";

const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const util = require("./util");
const unprefixFlexDirection = require("./unprefixFlexDirection");
const unprefixBreakInside = require("./unprefixBreakInside");
const unprefixGradient = require("./unprefixGradient");
const unprefixMsGrid = require("./unprefixMsGrid");
const properties = require("known-css-properties").all;
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

function getBrotherDecl (decl, prop) {
	const result = util.getDecls(decl.parent, prop);
	return result.length && result[result.length - 1];
}

const ALIGN_CONTENT = {
	"start": "flex-start",
	"end": "flex-end",
	"justify": "space-between",
	"distribute": "space-around",
};

const RE_BOX_DIRECTION = /^(?:-\w+-)?(?:flex)?box-direction$/i;
const RE_BOX_ORIENT = /^(?:-\w+-)?(?:flex)?box-orient$/i;
const RE_FLEX_FLOW = /^(?:-\w+-)?flex-flow$/i;

const declUnprefixers = [
	brotherFirst(/^(?:-\w+-)?box-ordinal-group$/i, /^(?:-\w+-)?order$/i),
	brotherFirst(/^(?:-\w+-)?box-flex$/i, /^(?:-\w+-)?flex-grow$/i),
	brotherFirst(/^(?:-\w+-)?box-flex$/i, /^(?:-\w+-)?flex$/i),
	brotherFirst(RE_BOX_ORIENT, RE_FLEX_FLOW),
	brotherFirst(RE_BOX_DIRECTION, RE_FLEX_FLOW),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-pack$/i, "justify-content", ALIGN_CONTENT),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-line-pack$/i, "align-content", ALIGN_CONTENT),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-item-align$/i, "align-self", ALIGN_CONTENT),
	valMap(/^(?:(?:-\w+-)?(?:flex)?box|-ms-flex)-align$/i, "align-items", ALIGN_CONTENT),
	unprefixFlexDirection,
	unprefixBreakInside,
	unprefixMsGrid,
	function writingMode (decl) {
		const prop = /^(?:-\w+-)?(writing-mode)/i.exec(decl.prop);
		if (prop) {
			const value = decl.value.toLowerCase();
			return {
				prop: "writing-mode",
				value: {
					"lr-tb": "horizontal-tb",
					"tb-rl": "vertical-rl",
					"tb-lr": "vertical-lr",
				}[value] || value,
			};
		}
	},
	function display (decl) {
		const display = /^(-\w+-)?display$/i.exec(decl.prop);
		if (display) {
			let value;
			if ((value = /^(?:-\w+-)?(inline-)?(?:flex)?box$/i.exec(decl.value))) {
				value = (value[1] || "") + "flex";
			} else if ((value = util.rePrefix.exec(decl.value))) {
				value = value[1];
			} else if (display[1]) {
				value = decl.value;
			} else {
				return;
			}

			return {
				prop: "display",
				value: value.toLowerCase(),
			};
		}
	},
	function imageRendering (decl) {
		let value;
		if (/^(?:-\w+-)?image-rendering$/i.test(decl.prop)) {
			if (/^-\w+-optimize-contrast$/i.test(decl.value)) {
				value = "crisp-edges";
			} else if ((value = util.rePrefix.exec(decl.value))) {
				value = value[1];
			} else {
				return;
			}
		} else if (/^-ms-interpolation-mode$/i.test(decl.prop) && /^nearest-neighbor$/i.test(decl.value)) {
			value = "pixelated";
		} else {
			return;
		}
		return {
			prop: "image-rendering",
			value: value,
		};
	},
	function borderRadius (decl) {
		const prop = /^(?:-\w+-)?border-radius-(top|bottom)(left|right)$/i.exec(decl.prop);
		if (prop) {
			return {
				prop: "border-" + prop[1].toLowerCase() + "-" + prop[2].toLowerCase() + "-radius",
				value: decl.value,
			};
		}
	},
	function unprefixFirst (decl) {
		let prop = util.rePrefix.exec(decl.prop);
		while (prop) {
			const brother = getBrotherDecl(decl, prop[1]);
			if (brother) {
				return decl2result(brother);
			} else {
				prop = /^(.+?)-\w+$/.exec(prop[1]);
			}
		}
	},
];

const PROP_NAME_MAP = {
	"border-radius-bottomleft": "border-bottom-left-radius",
	"border-radius-bottomright": "border-bottom-right-radius",
	"border-radius-topleft": "border-top-left-radius",
	"border-radius-topright": "border-top-right-radius",

	"border-after": "border-block-end",
	"border-before": "border-block-start",
	"border-end": "border-inline-end",
	"border-start": "border-inline-start",

	"margin-after": "margin-block-end",
	"margin-before": "margin-block-start",
	"margin-end": "margin-inline-end",
	"margin-start": "margin-inline-start",

	"padding-after": "padding-block-end",
	"padding-before": "padding-block-start",
	"padding-end": "padding-inline-end",
	"padding-start": "padding-inline-start",

	"mask-box-image": "mask-border",
	"mask-box-image-outset": "mask-border-outset",
	"mask-box-image-repeat": "mask-border-repeat",
	"mask-box-image-slice": "mask-border-slice",
	"mask-box-image-source": "mask-border-source",
	"mask-box-image-width": "mask-border-width",

	"box-ordinal-group": "order",
	"box-align": "align-items",
	"box-pack": "justify-content",
	"box-flex": "flex",
	"flex-preferred-size": "flex-basis",
	"flex-negative": "flex-shrink",
	"flex-positive": "flex-grow",
	"flex-order": "order",
};

const PREFIXED_VALUE_NAME_NAME = {
	"-moz-available": "stretch",
};

const unprefixValue = util.valueUnprefixer([
	unprefixGradient,
	function unprefixPropInValue (node, prop) {
		if (/^(?:-\w+-)?transition(?:-property)?$/.test(prop) && node.type === "word") {
			const prefixed = unprefixProp(node.value);
			if (prefixed) {
				node.value = prefixed;
				return node;
			}
		}
	},
	function autoUnprefix (node, prop) {
		const value = node.value.toLowerCase();
		const unprefixed = PREFIXED_VALUE_NAME_NAME[value] || postcss.vendor.unprefixed(value);
		const data = autoprefixer.data.prefixes[unprefixed];

		if (data && (!data.props || data.props.some((propName) => {
			return propName === "*" || propName === prop;
		}))) {
			node.value = unprefixed;
			return node;
		}
	},
]);

function unprefixProp (prop) {
	prop = util.rePrefix.exec(prop);

	if (!prop) {
		return;
	}

	prop = prop[1].toLowerCase();

	if (PROP_NAME_MAP[prop]) {
		return PROP_NAME_MAP[prop];
	}

	if (properties.indexOf(prop) >= 0) {
		return prop;
	}
}

function unprefix (decl) {
	let result;
	if (declUnprefixers.some((unprefixer) => {
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
	const result = unprefix(decl);
	result.replace = function () {
		if (result.prop && decl.prop.toLowerCase() !== result.prop) {
			decl.prop = result.prop;
		}
		if (result.value && decl.value.toLowerCase() !== result.value) {
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
