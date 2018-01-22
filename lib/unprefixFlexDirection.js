'use strict';
const util = require('./util');

const BOX_DIRECTION = {
	'lr': 'row',
	'rl': 'row-reverse',
	'tb': 'column',
	'bt': 'column-reverse',
};

const BOX_ORIENT = {
	horizontal: 'row',
	vertical: 'column',
};

const RE_BOX_DIRECTION = /^(?:-\w+-)?(?:flex)?box-direction$/i;
const RE_BOX_ORIENT = /^(?:-\w+-)?(?:flex)?box-orient$/i;

function boxDirection (decl) {
	let boxDirection = decl.value.toLowerCase();
	if (BOX_DIRECTION[boxDirection]) {
		return BOX_DIRECTION[boxDirection];
	} else if (boxDirection === 'reverse') {
		boxDirection = '-' + boxDirection;
	} else {
		boxDirection = '';
	}
	let boxOrient = 'row';

	util.getDecls(decl.parent, RE_BOX_ORIENT).forEach(function (decl) {
		boxOrient = BOX_ORIENT[decl.value.toLowerCase()] || boxOrient;
		decl.remove();
	});

	return boxOrient + boxDirection;
}

function boxOrient (decl) {
	const boxOrient = BOX_ORIENT[decl.value.toLowerCase()] || 'row';
	let boxDirection = '';

	util.getDecls(decl.parent, RE_BOX_DIRECTION).forEach(function (decl) {
		const value = decl.value.toLowerCase();
		if (value === 'reverse') {
			boxDirection = '-' + value;
		} else if (value === 'normal') {
			boxDirection = value;
		}
		decl.remove();
	});
	return boxOrient + boxDirection;
}

function unprefixFlexDirection (decl) {
	let value;
	if (RE_BOX_DIRECTION.test(decl.prop)) {
		value = boxDirection(decl);
	} else if (RE_BOX_ORIENT.test(decl.prop)) {
		value = boxOrient(decl);
	} else {
		return;
	}
	return value && {
		prop: 'flex-direction',
		value: value,
	};
}

module.exports = unprefixFlexDirection;
