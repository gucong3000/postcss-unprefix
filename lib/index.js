"use strict";
var postcss = require("postcss");
var autoprefixer = require("autoprefixer");

/**
 * 获取重复的属性。两种找法：1.位置在index之后的，有前缀的属性；2.位置不等于index的无前缀的属性。
 * @param  {Declaration}    decl  要查重的属性对象
 * @param  {String}         prop  要查找的无私有前缀的属性名
 * @param  {Int}            index decl在其父元素中的位置
 * @return {Declaration}    查找到的重复Declaration
 */
function getRepeatProp(decl, prop, index) {
	var fixedDecl;
	var retValue;
	decl.parent.walkDecls(new RegExp("^(?:-\\w+-)?" + prop + "$"), function(subDecl, i) {
		if (i > index || (i !== index && subDecl.prop === prop)) {
			if (decl.value === subDecl.value) {
				retValue = subDecl;
				return false;
			}

			var fixedSubDecl = getfixedDecl(subDecl);
			if (!fixedDecl) {
				fixedDecl = getfixedDecl(decl);
			}
			if (fixedSubDecl.value === fixedDecl.value) {
				retValue = subDecl;
				return false;
			}
		}
	});
	return retValue;
}

/**
 * 获取重复的@规则，不考虑子元素是否想用
 * @param  {AtRule} atRule 要查重的@规则对象
 * @param  {String} name   @规则对象的无前缀的name属性
 * @param  {Int}    index  atRule在父元素中的位置
 * @return {AtRule}        查找到的重复Declaration
 */
function getRepeatAtRules(atRule, name, index) {
	var retValue;
	atRule.parent.walkAtRules(new RegExp("^(?:-\\w+-)?" + name + "$"), function(subAtRule, i) {
		if ((i > index || (i !== index && atRule.name === subAtRule.name)) && atRule.params === subAtRule.params) {
			retValue = subAtRule;
			return false;
		}
	});
	return retValue;
}

/**
 * 调用各个属性对象修复模块，尝试修复属性对象
 * @param  {Declaration} decl 想要修复的Declaration对象
 * @return {Object}      包含修复后的prop和value属性的对象
 */
function tryfixPorp(decl) {
	var fixers;
	var index;
	fixers = [
		"flexbox",
		"image-rendering",
		"break-inside",
		"namemap",
		"prefixes",
	];
	index = 0;
	do {
		decl = require("./" + fixers[index])(decl) || decl;
	} while (++index < fixers.length);
	return decl;
}

/**
 * 调用各个属性值修复模块，尝试修复属性值
 * @param  {String} value 属性值
 * @param  {String} prop  属性名
 * @return {String}       修复后的属性值
 */
function tryfixValue(value, prop) {
	var fixers = [
		"gradient",
		"display-flex",
		"value-filter",
		"value-repeat",
		"writing-mode"
	];
	var index = 0;
	do {
		value = require("./" + fixers[index])(value, prop) || value;
	} while (++index < fixers.length);
	return value;
}

var fixedDeclCache = {};

/**
 * 修复属性值对象，将结果缓存，二次调用时，直接取缓存
 * @param  {Declaration} decl 想要修复的Declaration对象
 * @return {Object}      包含修复后的prop和value属性的对象
 */
function getfixedDecl(decl) {
	var key = decl.toString() + decl.parent.toString();
	if (key in fixedDeclCache) {
		return fixedDeclCache[key];
	} else {
		decl = tryfixPorp(decl);
		decl.value = tryfixValue(decl.value, decl.prop);
		fixedDeclCache[key] = decl;
		return decl;
	}
}

module.exports = postcss.plugin("postcss-unprefix", function() {

	return function(css) {
		postcss([
			autoprefixer({
				remove: true,
				browsers: []
			}),
		]).process(css).css;

		// 修正所有@规则的前缀
		css.walkAtRules(/^-\w+-/, function(rule, i) {
			var name = postcss.vendor.unprefixed(rule.name);
			if (getRepeatAtRules(rule, name, i)) {
				rule.remove();
			} else {
				rule.name = name;
			}

		});

		// 去除属性名和属性值中的前缀
		css.walkDecls(function(decl, i) {
			if (getRepeatProp(decl, postcss.vendor.unprefixed(decl.prop), i)) {
				decl.remove();
				return;
			}
			if (decl.prop === "-ms-filter") {
				return;
			}
			var result = getfixedDecl(decl);
			if (getRepeatProp(decl, result.prop, i)) {
				decl.remove();
				return;
			}
			if (result.prop !== decl.prop || result.value !== decl.value) {
				decl.replaceWith(result);
			}
		});
	};
});
