"use strict";

var postcss = require("postcss");
var directionMap = {
	"top": "bottom",
	"bottom": "top",
	"left": "right",
	"right": "left",
};

var unitFullMap = {
	deg: 360,
	grad: 400,
	rad: 2,
	turn: 1,
};

var degMap = {
	0: "top",
	90: "right",
	180: "bottom",
	270: "left",
};

function normalizeUnit(num, unit) {
	return parseFloat(num) * 360 / (unitFullMap[unit]);
}

// 修复各种gradient为标准写法，暂未实现`-webkit-gradient`
module.exports = function(value) {
	if (/-\w+-(?:repeating-)?\w+-gradient\(/g.test(value)) {
		var valueParser = require("postcss-value-parser");
		value = valueParser(value);
		value.nodes.forEach(function(node) {
			if (node.type === "function") {
				node.value = postcss.vendor.unprefixed(node.value);
				var dirfixed;
				var linear = /\blinear\b/.test(node.value);
				node.nodes.forEach(function(node) {
					if (node.type === "word") {
						if (directionMap[node.value]) {
							if (linear) {
								var to = dirfixed ? "" : "to ";
								dirfixed = true;
								node.value = to + (directionMap[node.value]);
							} else {
								node.value = "at " + node.value;
							}
						} else if (/^(-?\d+(?:.\d+)?)(\w+)$/.test(node.value)) {
							var deg = require("normalize-range").wrap(0, 360, 90 - normalizeUnit(RegExp.$1, RegExp.$2));
							if(isNaN(deg)){
								return;
							}
							if (degMap[deg]) {
								node.value = "to " + degMap[deg];
							} else {
								node.value = deg + "deg";
							}
						}
					}
				});
			}
		});
		value = valueParser.stringify(value);
		return value;
	}
};