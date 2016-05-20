"use strict";

// 修复css值中，修复前缀后造成的取值多次重复
module.exports = function(value) {
	return value.replace(/(^|\s|,)(?:-[a-z]+-)?([a-z]+[^;:{}]*)(?:\s*,\s*(?:-[a-z]+-)?\2)+/g, "$1$2");
};