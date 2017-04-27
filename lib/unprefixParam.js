'use strict';

const util = require('./util');

function unprefixMedia (params) {
	const decl = {};
	return params.split(/\s*,\s*/).filter(function (param) {
		param = param.match(/^\(\s*(-\w+-)?(\w+(?:-\w+)*)\s*\:\s*(.+?)\s*\)$/);
		if (!param) {
			return true;
		}
		if (/^(\w+-)?device-pixel-ratio$/i.test(param[2])) {
			param[2] = RegExp.$1 + 'resolution';
			if (param[1] && decl[param[2]]) {
				return;
			}

			try {
				param[3] = eval(param[3]) * 96 + 'dpi';
			} catch (ex) {
				return;
				//
			}
		}
		decl[param[2]] = param[3];
	}).concat(Object.keys(decl).sort().map(function (prop) {
		return `(${ prop }: ${ decl[prop] })`;
	})).join(', ');
}


module.exports = function (params, name) {
	if (/^media$/i.test(name)) {
		return unprefixMedia(params);
	}
};
