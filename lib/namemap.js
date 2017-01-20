"use strict";
var postcss = require("postcss");

// 老旧的css属性，在最新标准语法中的替代项

var nameMap = {
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

	"box-align": "align-items",
	"box-pack": "justify-content",
	"box-ordinal-group": "order",
	"box-flex": "flex",

	"-ms-flex-positive": "flex-grow",
	"-ms-grid-column-align": "grid-row-align",
	"-ms-grid-column-span": "grid-column",
	"-ms-grid-columns": "grid-template-columns",
	"-ms-grid-row-span": "grid-row-end",
	"-ms-grid-rows": "grid-template-rows",
	"-ms-interpolation-mode": "image-rendering",
	"-ms-flex-item-align": "align-self",
	"-ms-flex-pack": "justify-content",
	"-ms-flex-line-pack": "align-content",
	"-ms-flex-preferred-size": "flex-basis",
	"-ms-flex-negative": "flex-shrink"
};

var autoprefixer = require("autoprefixer");

// 修复各种css属性名称，和css值中含有的带前缀的css属性名称
module.exports = function(decl) {
	var prop;
	var value;
	if (/^(?:-\w+-)?(transition(?:-property)?)$/.test(decl.prop)) {
		prop = RegExp.$1;
		value = decl.value.replace(/(^|\s|,|\()-\w+-(\w+(?:-\w+)*)/g, function(s, pre, property) {
			if (property in nameMap) {
				return pre + nameMap[property];
			} else if (property in autoprefixer.data.prefixes) {
				return pre + property;
			} else {
				return s;
			}
		});
	} else if ((prop = nameMap[decl.prop]) || (prop = nameMap[postcss.vendor.unprefixed(decl.prop)])) {
		value = decl.value;
	} else {
		return;
	}
	return {
		prop: prop,
		value: value,
	};
};
