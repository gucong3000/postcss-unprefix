"use strict";

var postcss = require("postcss");
var valueParser = require("postcss-value-parser");

// 老式方向关键字转换
var directionMap = {
	"top": "bottom",
	"bottom": "top",
	"left": "right",
	"right": "left",
};

// 各种角度单位与deg之间的换算关系
var angleUnitMap = {
	grad: 400,
	rad: 2 * Math.PI,
	turn: 1,
};

// 各种长度单位与deg之间的换算关系
var lengthUnitMap = {
	cm: 2.54,
	mm: 25.4,
	q: 101.6,
	pt: 72,
	pc: 6,
	px: 96,
};

// 角度转为关键字
var degMap = {
	0: "top",
	90: "right",
	180: "bottom",
	270: "left",
};

// 将字符串转为数字与其单位
function parseNum(string) {
	var num = parseFloat(string.replace(/(\D+)$/, ""));
	var unit = RegExp.$1 || "";
	if (!isNaN(num)) {
		return {
			num: num,
			unit: unit,
		};
	}
}

/**
 * 将角度转换为已°为单位
 */
function parseAngle(string) {
	var value = parseNum(string);
	if (value) {
		if (!value.unit || value.unit === "deg") {
			value.deg = value.num;
		} else if (angleUnitMap[value.unit]) {
			value.deg = value.num * 360 / angleUnitMap[value.unit];
		} else {
			return;
		}
		value.deg = require("normalize-range").wrap(0, 360, 90 - value.deg);
		return value;
	}
}

function angle2String(angleObj) {
	var deg = angleObj.deg;
	if (angleObj.unit && angleObj.unit !== "deg") {
		deg = (deg * angleUnitMap[angleObj.unit] / 360);
	}
	deg = parseFloat(deg.toFixed(4));
	if (deg) {
		deg += angleObj.unit || "deg";
	} else {
		deg = String(deg);
	}
	return deg;
}

function parseColorStop(colorStop) {
	colorStop = colorStop.nodes;
	colorStop.reverse();
	return colorStop;
}

// 分析css node中的位置信息
function normalizePos(point, args) {
	args.forEach(function(arg, i) {
		if (arg === "top") {
			point.y = 0;
		} else if (arg === "right") {
			point.x = 100;
		} else if (arg === "bottom") {
			point.y = 100;
		} else if (arg === "left") {
			point.x = 0;
		} else if (arg === "center") {
			point[i ? "y" : "x"] = 50;
		} else {
			point[i ? "y" : "x"] = parseFloat(arg);
		}
	});
}

function fixOldRadialGradient(args) {
	// return args;
}

function fixOldLinearGradient(args) {
	var angle;
	var start = {};
	var end = {};

	normalizePos(start, args[0]);
	normalizePos(end, args[1]);

	angle = 180 - Math.atan2(end.x - start.x, end.y - start.y) * (180 / Math.PI);
	angle = require("normalize-range").wrap(0, 360, angle);
	if (angle !== 180) {
		angle = angle2String({
			deg: angle,
			unit: angle ? "deg" : "",
		});
		return [angle];
	} else {
		return [];
	}

}

/**
 * `-webkit-gradient`转`radial-gradient`或`linear-gradient`
 * @param  {Node} gradient   `postcss-value-parser`插件转换后的-webkit-gradient
 */
function fixOldGradient(args, gradient) {
	var type = args[0][0];
	var colorStops = [];
	var from;
	var to;

	args = args.slice(1).filter(function(arg) {
		var fnName = arg.value;
		if (fnName === "from") {
			from = arg;
		} else if (fnName === "to") {
			to = arg;
		} else if (fnName === "color-stop") {
			colorStops.push(arg);
		} else {
			return true;
		}
		return false;
	});

	if (from) {
		colorStops.unshift(from);
	}
	if (to) {
		colorStops.push(to);
	}

	if (type === "radial") {
		args = fixOldRadialGradient(args);
	} else {
		args = fixOldLinearGradient(args);
	}
	if (args) {
		gradient.value = type + "-gradient";
		return args.concat(colorStops.map(parseColorStop));
	}
}

function fixLinearGradient(args) {
	var angle = parseAngle(args[0][0]);

	if (angle) {
		var deg = Math.round(angle.deg);
		if (degMap[deg]) {
			args[0] = ["to", degMap[deg]];
		} else {
			args[0] = angle2String(angle);
		}
	} else {
		var position;
		args[0].forEach(function(arg, i) {
			if (arg === "center") {
				position = args[0];
			} else if (directionMap[arg]) {
				args[0][i] = directionMap[arg];
				position = args[0];
			}
		});
		if (position) {
			position.unshift("to");
		}
	}

	if (args[0].length === 2 && args[0][0] === "to" && args[0][1] === "bottom") {
		args.shift();
	}

	return args;
}

function fixRadialGradient(args) {
	var position;
	var keyword;

	args[0].forEach(function(arg) {
		if (arg === "center" || directionMap[arg] || parseNum(arg)) {
			position = args[0];
		}
	});
	if (position) {
		position.unshift("at");
		args.forEach(function(subArgs, i) {
			subArgs.forEach(function(arg) {
				if (/^\w+-\w+$/.test(arg)) {
					keyword = args[i];
				}
			});
		});
		if (keyword) {
			position.unshift.apply(position, keyword);
			args = args.filter(function(arg) {
				return arg !== keyword;
			});
		}
	}

	return args;
}

/**
 * `radial-gradient`或`linear-gradient`去前缀并转换语法
 * @param  {Node} gradient   `postcss-value-parser`插件转换后的-webkit-gradient
 */
function fixGradient(gradient, type) {
	if (type === "radial") {
		return fixRadialGradient(gradient);
	} else {
		return fixLinearGradient(gradient);
	}
}

function parseFunction(node) {
	var args = [];
	var index = 0;
	node.nodes.forEach(function(subNode) {
		if (subNode.type === "div" && subNode.value === ",") {
			index++;
			return;
		} else if (subNode.type === "function") {
			if ((subNode.value === "from" || subNode.value === "to" || subNode.value === "color-stop")) {
				var colorStop = subNode.nodes.filter(function(colorStopInfo) {
					return colorStopInfo.type === "function" || colorStopInfo.type === "word";
				}).map(function(colorStopInfo) {
					return valueParser.stringify(colorStopInfo);
				});
				colorStop = {
					nodes: colorStop,
					type: "function",
					value: subNode.value,
				};
				return args[index] = colorStop;
			}
		} else if (subNode.type !== "word") {
			return;
		}
		if (!args[index]) {
			args[index] = [];
		}
		args[index].push(valueParser.stringify(subNode));
	});
	return args;
}

function stringifyArg(arg) {
	if (Array.isArray(arg)) {
		return arg.map(stringifyArg).join(" ");
	} else if (typeof arg === "string") {
		return arg;
	} else {
		return valueParser.stringify(arg);
	}
}

function stringifyGradient(gradient, args) {
	if (args) {
		gradient.value = gradient.value + "(" + args.map(stringifyArg).join(", ") + ")";
		gradient.type = "word";
		delete gradient.nodes;
	}
}

module.exports = function(value) {
	if (/-\w+-(?:repeating-)?(?:\w+-)?gradient\(/.test(value)) {
		value = valueParser(value);
		value.nodes.forEach(function(node) {
			if (node.type === "function") {
				if (/^-\w+-gradient$/.test(node.value)) {
					stringifyGradient(node, fixOldGradient(parseFunction(node), node));
				} else if (/^-\w+-(?:\w+-)?(\w+)-gradient$/.test(node.value)) {
					node.value = postcss.vendor.unprefixed(node.value);
					stringifyGradient(node, fixGradient(parseFunction(node), RegExp.$1));
				}
			}
		});
		value = valueParser.stringify(value);
		return value;
	}
};