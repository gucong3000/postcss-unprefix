"use strict";
var postcss = require("postcss");

// 老旧的css属性，在最新标准语法中的替代项
var nameMap = {
    "border-radius-topleft": "border-top-left-radius",
    "border-radius-bottomright": "border-bottom-right-radius",
    "border-radius-bottomleft": "border-bottom-left-radius",
    "border-radius-topright": "border-top-right-radius",
    "box-direction": "flex-direction",
    "box-orient": "flex-direction",
    "flex-align": "align-items",
};

// 用于查找属性名中的私有前缀
var reValPrefix = /(^|\s|,|\()-\w+-/g;

// 用于查找属性值中的私有前缀
var reNamePrefix = /^-\w+-/;

// console.log(autoprefixer.data.prefixes["border-radius-topright"]);

/**
 * 去除属性值中的私有前缀
 * @param  {String} val 属性值
 * @return {String}     去除了私有前缀之后的属性值
 */
function unprefix(val) {
    return val.replace(reValPrefix, "$1");
}

/**
 * 获取重复的属性，不考虑值。两种找法：1.位置在index之后的，有前缀的属性；2.任意位置的无前缀的属性。
 * @param  {Declaration}    decl  要查重的属性对象
 * @param  {String}         prop  要查找的无私有前缀的属性名
 * @param  {Int}            index decl在其父元素中的位置
 * @return {Declaration}    查找到的重复Declaration
 */
function getRepeatProp(decl, prop, index) {
    var retValue;
    decl.parent.walkDecls(new RegExp("^(?:-\\w+-)?" + prop + "$"), function(decl, i) {
        if (i > index || decl.prop === prop) {
            retValue = decl;
            return false;
        }
    });
    return retValue;
}

/**
 * 获取重复的@规则，查找参数一致的。两种找法：1.位置在index之后的，有前缀的@规则；2.任意位置的无前缀的@规则。
 * @param  {AtRule} atrule  要查重的rule对象
 * @param  {String} name    atrule对象的name属性的无前缀版本
 * @param  {String} params  atrule对象的params属性的无前缀版本
 * @param  {Int} index      atrule在其父元素中的位置
 * @return {AtRule}         查找到的重复AtRule
 */
function getRepeatAtRules(atrule, name, params, index) {
    var retValue;
    atrule.parent.walkAtRules(new RegExp("^(?:-\\w+-)?" + name + "$"), function(rule, i) {
        if (unprefix(rule.params) === params && (i > index || rule.name === name)) {
            retValue = rule;
            return false;
        }
    });
    return retValue;
}

module.exports = postcss.plugin("postcss-clean-prefixes", function(options) {
    options = options || {};

    return function(css) {

        // 修正所有@规则的前缀
        css.walkAtRules(reNamePrefix, function(rule, i) {
            var name = postcss.vendor.unprefixed(rule.name);
            var params = unprefix(rule.params);
            if (getRepeatAtRules(rule, name, params, i)) {
                rule.remove();
            } else {
                rule.name = name;
                rule.params = params;
            }
        });

        // 修正@supports中的前缀
        css.walkAtRules("supports", function(rule) {
            rule.params = rule.params.replace(/(?:\(\s*)?\(\s*(.*?)(?:-\w+-)?(.*?)(?:-\w+-(.*?))?\s*\)\s*or\s*\(\s*\1(?:-\w+-)?\2\s*\)(?:\s*\))?/g, "($1$2)");
        });

        // 去除属性名中的前缀
        css.walkDecls(reNamePrefix, function(decl, i) {
            if (decl.prop === "-ms-filter") {
                return;
            }
            var prop = postcss.vendor.unprefixed(decl.prop);
            prop = nameMap[prop] || prop;

            if (getRepeatProp(decl, prop, i)) {
                decl.remove();
            } else {
                decl.prop = prop;
                decl.value = unprefix(decl.value);
            }
        });
    };
});