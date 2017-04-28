"use strict";
var describe = require("mocha").describe;
var it = require("mocha").it;
var fs = require("fs");
var assert = require("assert");

function process(css, postcssOpts, opts) {
	var postcss = require("postcss");
	var processors = [
		require("..")(opts),
	];
	return postcss(processors).process(css, postcssOpts).css;
}

var files = fs.readdirSync("./test/fixtures");

files = files.filter(function(filename) {
	return /\.css$/.test(filename) && !/\.out\.css$/.test(filename);
});
describe("fixtures", function() {

	var allRight = true;

	// files = ["grid.css"]

	files.forEach(function(filename) {

		var testName = filename.replace(/\.\w+$/, "");
		var inputFile = "./test/fixtures/" + filename;
		var input = fs.readFileSync(inputFile).toString();
		var output = "";
		try {
			output = fs.readFileSync("./test/fixtures/" + testName + ".out.css").toString();
		} catch (ex) {

		}
		var real = process(input, {
			from: inputFile,
		});

		if (allRight) {
			it(testName, function() {
				assert.equal(output, real);
			});
		}

		if (input === real) {
			console.error(inputFile);
		}

		if (real !== output) {
			allRight = false;
			fs.writeFileSync("./test/fixtures/" + testName + ".out.css", real);
			return false;
		}
	});
});
