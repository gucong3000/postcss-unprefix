"use strict";
var postcss = require("postcss");
var autoprefixer = require("autoprefixer");

var nameMap = {
    "border-radius-topleft": "border-top-left-radius",
    "border-radius-bottomright": "border-bottom-right-radius",
    "border-radius-bottomleft": "border-bottom-left-radius",
    "border-radius-topright": "border-top-right-radius",
};
// console.log(autoprefixer.data.prefixes["border-radius-topright"]);

function getUnprefixedProperty(decl, name) {
    var value = decl.value.replace(/\s+/g, "");
    var retValue;
    decl.parent.walkDecls(name, function(decl) {
        if (decl.value.replace(/\s+/g, "") === value) {
            retValue = decl;
            return false;
        }
    });
    return retValue;
}

function getUnprefixedAtRules(rule, name) {
    var retValue;
    rule.parent.walkAtRules(name, function(sibling) {
        if (rule.params === sibling.params) {
            retValue = sibling;
            return false;
        }
    });
    return retValue;
}

module.exports = postcss.plugin("postcss-clean-prefixes", function(options) {
    options = options || {};

    return function(css) {
        css.walkDecls(/^-\w+-/, function(decl) {
            if (decl.prop === "-ms-filter") {
                return;
            }
            var prop = postcss.vendor.unprefixed(decl.prop);
            prop = nameMap[prop] || prop;

            if (prop in autoprefixer.data.prefixes) {
                decl.value = decl.value.replace(/(^|\s|,|;|\()-\w+-/, "$1");
                if (getUnprefixedProperty(decl, prop)) {
                    decl.remove();
                } else {
                    decl.prop = prop;
                }
            }
        });
        css.walkAtRules(/^-\w+-/, function(rule) {
            var name = postcss.vendor.unprefixed(rule.name);
            if (getUnprefixedAtRules(rule, name)) {
                rule.remove();
            } else {
                rule.name = name;
            }
        });
    };
});