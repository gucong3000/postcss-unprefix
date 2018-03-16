'use strict';
const postcss = require('postcss');
const clearDecl = require('./clearDecl');
const clearAtRule = require('./clearAtRule');
const clearRule = require('./clearRule');

module.exports = postcss.plugin('postcss-unprefix', () => {
	return function (css) {
		css.walkAtRules(clearAtRule);
		css.walkRules(clearRule);
		css.walkDecls(clearDecl);
	};
});
