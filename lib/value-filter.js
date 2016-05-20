"use strict";

// 将css属性值中的所有filter函数转换为无前缀版本
module.exports = function(value) {
	return value.replace(/(^|\s|,|\()-\w+-(filter\()/g, "$1$2");
};