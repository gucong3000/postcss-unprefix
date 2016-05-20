"use strict";

// 将和`-ms-interpolation-mode`属性修复为`image-rendering: pixelated`
module.exports = function(decl) {
	if (/^(?:-\w+-)?interpolation-mode$/.test(decl.prop)) {
		return {
			prop: "image-rendering",
			value: "pixelated",
		};
	}
};