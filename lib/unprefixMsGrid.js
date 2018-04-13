"use strict";
const util = require("./util");

function unprefixMsGrid (decl) {
	let prop = /^-ms-grid-(\w+)(?:-(.+))?$/i.exec(decl.prop);
	if (!prop) {
		return;
	}
	const aspect = prop[1].toLowerCase();
	prop = prop[2] && prop[2].toLowerCase();
	let value = decl.value.toLowerCase();
	if (!prop) {
		if (/s$/i.test(aspect)) {
			return {
				prop: "grid-template-" + aspect,
				value: value,
			};
		} else {
			prop = "start";
		}
	} else if (prop === "span") {
		prop = "end";
		value = "span " + value;
	} else if (prop === "align") {
		return {
			prop: "align-self",
			value: value.replace(/^(start|end)$/i, "flex-$1"),
		};
	} else {
		return;
	}

	prop = ["grid", aspect, prop].join("-");

	util.getDecls(decl.parent, ["grid", aspect].join("-")).forEach((parentDecl) => {
		prop = parentDecl.prop;
		value = parentDecl.value;
	});

	return {
		prop: prop,
		value: value,
	};
}

module.exports = unprefixMsGrid;
