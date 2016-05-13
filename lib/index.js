"use strict";
var postcss = require("postcss");

var nameMap = {
    "border-radius-topleft": "border-top-left-radius",
    "border-radius-bottomright": "border-bottom-right-radius",
    "border-radius-bottomleft": "border-bottom-left-radius",
    "border-radius-topright": "border-top-right-radius",
    "box-direction": "flex-direction",
    "box-orient": "flex-direction",
    "flex-align": "align-items",
};

var reValPrefix = /(^|\s|,|\()-\w+-/;
var reNamePrefix = /^-\w+-/;
// console.log(autoprefixer.data.prefixes["border-radius-topright"]);

function unprefix(val) {
    return val.replace(reValPrefix, "$1");
}

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

function getRepeatAtRules(rule, name, params, index) {
    var retValue;
    rule.parent.walkAtRules(new RegExp("^(?:-\\w+-)?" + name + "$"), function(rule, i) {
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
        css.walkAtRules("supports", function(rule) {
            rule.params = rule.params.replace(/(?:\(\s*)?\(\s*(.*?)(?:-\w+-)?(.*?)(?:-\w+-(.*?))?\s*\)\s*or\s*\(\s*\1(?:-\w+-)?\2\s*\)(?:\s*\))?/g, "($1$2)");
        });
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