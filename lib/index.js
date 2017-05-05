'use strict';
const postcss = require('postcss');
const decl = require('./decl');
const atRule = require('./atRule');
const rule = require('./rule');

module.exports = postcss.plugin('postcss-unprefix', function () {
	return function (css) {
		atRule(css);
		rule(css);
		decl(css);
	};
});
