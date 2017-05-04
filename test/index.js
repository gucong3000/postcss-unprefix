'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const fs = require('fs');
const assert = require('assert');
const stylelint = require('stylelint');
const reporter = require('postcss-reporter');

function process (css, postcssOpts, opts) {
	const postcss = require('postcss');
	const processors = [
		require('..')(opts),
		stylelint,
		reporter({
			throwError: true,
		}),
	];
	return postcss(processors).process(css, postcssOpts);
}

let files = fs.readdirSync('./test/fixtures');

files = files.filter(function (filename) {
	return /\.css$/.test(filename) && !/\.out\.css$/.test(filename);
});
describe('fixtures', function () {

	// const allRight = true;

	// files = ["grid.css"]

	files.forEach(function (filename) {

		const testName = filename.replace(/\.\w+$/, '');
		const inputFile = './test/fixtures/' + filename;
		const input = fs.readFileSync(inputFile).toString();
		let output = '';
		try {
			output = fs.readFileSync('./test/fixtures/' + testName + '.out.css').toString();
		} catch (ex) {
			//
		}

		if (input === output) {
			console.error(inputFile);
		}

		it(testName, function () {
			let real;
			return process(input, {
				from: inputFile,
			}).then((result) => {
				real = result.css;
				assert.equal(output, real);
			}).catch(ex => {
				if (real) {
					fs.writeFileSync('./test/fixtures/' + testName + '.out.css', real);
				}
				throw ex;
			});
		});
	});
});
