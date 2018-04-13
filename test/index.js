"use strict";
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
	// eslint-disable-next-line no-extend-native
	Object.defineProperty(Array.prototype, "includes", {
		value: function (searchElement, fromIndex) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError("\"this\" is null or not defined");
			}

			const o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			const len = o.length >>> 0;

			// 3. If len is 0, return false.
			if (len === 0) {
				return false;
			}

			// 4. Let n be ? ToInteger(fromIndex).
			//    (If fromIndex is undefined, this step produces the value 0.)
			const n = fromIndex | 0;

			// 5. If n ≥ 0, then
			//  a. Let k be n.
			// 6. Else n < 0,
			//  a. Let k be len + n.
			//  b. If k < 0, let k be 0.
			let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

			// 7. Repeat, while k < len
			while (k < len) {
				// a. Let elementK be the result of ? Get(O, ! ToString(k)).
				// b. If SameValueZero(searchElement, elementK) is true, return true.
				// c. Increase k by 1.
				// NOTE: === provides the correct "SameValueZero" comparison needed here.
				if (o[k] === searchElement) {
					return true;
				}
				k++;
			}

			// 8. Return false
			return false;
		},
	});
}

const fs = require("fs");
const assert = require("assert");
const stylelint = require("stylelint");
const reporter = require("postcss-reporter");
const unprefix = require("..");

function process (css, postcssOpts, opts) {
	const postcss = require("postcss");
	const processors = [
		unprefix(opts),
		stylelint,
		reporter(),
	];
	return postcss(processors).process(css, postcssOpts);
}

let files = fs.readdirSync("./test/fixtures");

files = files.filter((filename) => {
	return /\.(?:c|le|sc)ss$/.test(filename) && !/\.\w+\.\w+$/.test(filename);
});
describe("fixtures", () => {
	// files = ["values.css"]

	files.forEach((filename) => {
		const testName = filename.replace(/\.\w+$/, "");
		const inputFile = "./test/fixtures/" + filename;
		const outputFile = inputFile.replace(/\.(\w+)$/, ".out.$1");
		const syntax = RegExp.$1.toLowerCase();
		const input = fs.readFileSync(inputFile).toString();
		let output = "";
		try {
			output = fs.readFileSync(outputFile).toString();
		} catch (ex) {
			//
		}

		if (input === output) {
			console.error(inputFile);
		}

		it(testName, () => {
			let real;
			return process(input, {
				from: inputFile,
				syntax: syntax === "css" ? null : require("postcss-" + syntax),
			}).then((result) => {
				real = result.css;
				assert.equal(output, real);
				assert.equal(result.messages.length, 0);
			}).catch(ex => {
				if (real) {
					fs.writeFileSync(inputFile.replace(/\.(\w+)$/, ".out.$1"), real);
				}
				throw ex;
			});
		});
	});
});
