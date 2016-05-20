"use strict";
var autoprefixer = require("autoprefixer");

var prefixes = [];
for (var i in autoprefixer.data.prefixes) {
	prefixes.push(i);
}
var reProp = new RegExp("^-\\w+-(" + prefixes.join("|") + ")$");
var reValue = new RegExp("(^|\\s|,|\\()-\\w+-(" + prefixes.join("|") + ")(\\s|,|\\)|$)", "g");

// 将autoprefixer所支持的各种属性名，转换为无前缀版本
module.exports = function(decl) {
	return {
		prop: decl.prop.replace(reProp, "$1"),
		value: decl.value.replace(reValue, "$1$2$3"),
	};
};