"use strict";

// 各种私有写法修正成标准的`break-inside: column-avoid`和`break-inside: page-avoid`等
module.exports = function(decl) {
	if (/^(?:-\w+-)?(\w+)-break-(\w+)/.test(decl.prop)) {
		return {
			prop: "break-" + RegExp.$2,
			value: decl.value === "avoid" ? RegExp.$1 + "-avoid" : decl.value,
		};
	}
};
