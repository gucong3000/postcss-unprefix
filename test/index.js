"use strict";
/* global describe, it */
var fs = require("fs");
var assert = require("assert");

function process(css, postcssOpts, opts) {
	var postcss = require("postcss");
	var processors = [
		require("postcss-gradientfixer"),
		require("postcss-flexboxfixer"),
		require("autoprefixer")({
			remove: true,
			browsers: []
		}),
		require("..")(opts),
	];
	return postcss(processors).process(css, postcssOpts).css;
}

var files = fs.readdirSync("./test/fixtures");

files = files.filter(function(filename) {
	return /\.css$/.test(filename) && !/-(?:out|real)\.css$/.test(filename);
});
describe("fixtures", function() {

	var allRight = true;

	files.forEach(function(filename) {

		var testName = filename.replace(/\.\w+$/, "");
		var inputFile = "./test/fixtures/" + filename;
		var input = fs.readFileSync(inputFile).toString();
		var output = "";
		try {
			output = fs.readFileSync("./test/fixtures/" + testName + "-out.css").toString();
		} catch (ex) {

		}
		var real = process(input, {
			form: inputFile
		});

		if (allRight) {
			it(testName, function() {
				assert.equal(real, output);
			});
		}

		if (input === real) {
			console.error(inputFile);
		}

		if (real !== output) {
			allRight = false;
			// fs.writeFileSync("./test/fixtures/" + testName + "-out.css", real);
			return false;
		}
	});
});