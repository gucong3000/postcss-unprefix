'use strict';
const gulp = require('gulp');
const rename = require('gulp-rename');
const stylefmt = require('gulp-stylefmt');
gulp.task('default', () => {
	return gulp.src('../autoprefixer/test/cases/*.css')
	.pipe(stylefmt())
	.pipe(rename(function (path) {
		if (/\.out$/.test(path.basename)) {
			path.basename = path.basename.replace(/\.out$/, '');
		} else {
			path.basename += '.out';
		}
	}))
	.pipe(gulp.dest('./test/fixtures'));
});
