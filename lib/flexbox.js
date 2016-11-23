"use strict";
var postcss = require("postcss");

function getValueForProperty(parent, name) {
	var retValue;
	parent.walkDecls(new RegExp("^(?:-\\w+-)?" + name + "$"), function(decl) {
		retValue = decl.value;
	});
	return retValue;
}

function createFixupFlexboxDeclaration(propname, value, parent) {
	// remove vendor prefixes from names, values

	propname = postcss.vendor.unprefixed(propname);
	value = postcss.vendor.unprefixed(value);

	var mappings = {
		"display": {
			valueMap: {
				"box": "flex",
				"flexbox": "flex",
				"inline-box": "inline-flex",
				"inline-flexbox": "inline-flex"
			}
		},
		"box-align": {
			newName: "align-items",
			valueMap: {
				"start": "flex-start",
				"end": "flex-end"
			}
		},
		"flex-direction": {
			valueMap: {
				"lr": "row",
				"rl": "row-reverse",
				"tb": "column",
				"bt": "column-reverse"
			}
		},
		"box-pack": {
			newName: "justify-content",
			valueMap: {
				"start": "flex-start",
				"end": "flex-end",
				"justify": "space-between"
			}
		},
		"box-ordinal-group": {
			newName: "order",
			valueMap: {}
		},
		"box-flex": {
			newName: "flex",
			valueMap: {}
		}
	};

	// 2009 => 2011
	mappings["flex-align"] = mappings["box-align"];
	// 2009 => 2011
	mappings["flex-order"] = mappings["box-ordinal-group"];

	if (propname in mappings) {
		if (value in mappings[propname].valueMap) {
			value = mappings[propname].valueMap[value];
		}
		propname = mappings[propname].newName || propname;
	}

	// some stuff is more complicated than a simple substitution..
	// box-flex:0 maps to 'none', other values need 'auto' appended - thanks to Daniel Holbert
	if (propname === "flex" && value === "0") {
		value = "none";
	}

	// box-direction, box-orient is a bit of a mess - these two 2009 draft values turn into 2011's flex-direction, which again has different values for final spec
	if (propname === "box-direction" || propname === "box-orient") {
		var dir, orient;
		if (propname === "box-direction") {
			dir = value;
			orient = getValueForProperty(parent, "box-orient");
		} else {
			orient = value;
			dir = getValueForProperty(parent, "box-direction");
		}

		// horizontal,normal => row, vertical,normal => column. horizontal,reverse => row-reverse etc..
		// lr, rl etc are handled by the simpler mapping above, so we don't need to worry about those
		value = orient === "vertical" ? "column" : "row";
		if (dir === "reverse") {
			value += "-reverse";
		}
		propname = "flex-direction";
	}

	return {
		prop: propname,
		value: value
	};
}

module.exports = function(decl) {
	if (/^(?:-\w+-)?(?:box-(?:align|direction|flex|ordinal-group|orient|pack)|flex(?:-\w+)*)$/.test(decl.prop) || (decl.prop === "display" && /^-\w+-/.test(decl.value))) {
		var result = createFixupFlexboxDeclaration(decl.prop, decl.value, decl.parent);
		if (result.prop !== decl.prop || result.value !== decl.value) {
			return result;
		}
	}
};
