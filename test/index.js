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
			// throwError: true,
		}),
	];
	return postcss(processors).process(css, postcssOpts);
}

let files = fs.readdirSync('./test/fixtures');

files = files.filter(function (filename) {
	return /\.(?:c|le|sc)ss$/.test(filename) && !/\.out\.\w+$/.test(filename);
});
describe('fixtures', function () {

	// const allRight = true;

	// files = ["grid.css"]

	files.forEach(function (filename) {

		const testName = filename.replace(/\.\w+$/, '');
		const inputFile = './test/fixtures/' + filename;
		const outputFile = inputFile.replace(/\.(\w+)$/, '.out.$1');
		const syntax = RegExp.$1.toLowerCase();
		const input = fs.readFileSync(inputFile).toString();
		let output = '';
		try {
			output = fs.readFileSync(outputFile).toString();
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
				syntax: syntax === 'css' ? null : require('postcss-'+ syntax),
			}).then((result) => {
				real = result.css;
				assert.equal(output, real);
			}).catch(ex => {
				if (real) {
					fs.writeFileSync(outputFile, real);
				}
				throw ex;
			});
		});
	});
});
