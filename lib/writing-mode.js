"use strict";

var dirMap = {
	"lr-tb": "horizontal-tb",
	"tb-rl": "vertical-rl",
	"tb-lr": "vertical-lr",
};

// 将IE的writing-mode属性取值转换为标准的
module.exports = function(value, prop) {
	if (/^(?:-\w+-)?writing-mode$/.test(prop) && dirMap[value]) {
		return dirMap[value];
	}
};