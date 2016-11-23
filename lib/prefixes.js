"use strict";
var autoprefixer = require("autoprefixer");

var prefixes = Object.keys(autoprefixer.data.prefixes).join("|");
var reProp = new RegExp("^-\\w+-(" + prefixes + ")$");
var reValue = new RegExp("(^|\\s|,|\\()-\\w+-(" + prefixes + ")(\\s|,|\\)|$)", "g");

// 将autoprefixer所支持的各种属性名，转换为无前缀版本
module.exports = function(decl) {
	return {
		prop: decl.prop.replace(reProp, "$1"),
		value: decl.value.replace(reValue, "$1$2$3"),
	};
};
