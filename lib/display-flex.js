"use strict";

// 各种私有写法修正成标准的`display: flex`和`display: inline-flex`
module.exports = function(value, prop) {
	if (/^(?:-\w+-)?display$/.test(prop) ) {
		return value.replace(/(?:-\w+-)?(inline-)?(?:flex)?box\b/g, "$1flex");
	}
};