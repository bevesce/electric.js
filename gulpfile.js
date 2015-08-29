var gulp = require('gulp');
var typescript = require('gulp-typescript');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var mocha = require('gulp-mocha');
var inject = require('gulp-inject');

gulp.task('test', function() {
    return gulp.src('./build/test/*.js', {read: false})
        .pipe(mocha());
});

gulp.task('test-todomvc', function() {
    return gulp.src('./build/examples/todomvc/test/*.js', {read: false})
        .pipe(mocha());
});

gulp.task('build-test', function() {
	var tsResult = gulp.src('./test/*.ts')
		.pipe(typescript({
			noImplicitAny: true,
			module: 'commonjs'
		}));
	return tsResult.js.pipe(gulp.dest('build/test/'));
});

gulp.task('build-test-in-browser', function() {
	var tsResult = gulp.src('./test-in-browser/*.ts')
		.pipe(typescript({
			noImplicitAny: true,
			module: 'commonjs'
		}));
	return tsResult.js.pipe(gulp.dest('build/test-in-browser/'));
});

gulp.task('build-src', function() {
	var tsResult = gulp.src(['./src/*.ts', './src/**/*.ts'])
		.pipe(typescript({
			noImplicitAny: true,
			module: 'commonjs'
		}));
	return tsResult.js.pipe(gulp.dest('build/src/'));
});

gulp.task('build-examples', function() {
	var tsResult = gulp.src([
		'./examples/*.ts', './examples/**/*.ts',
		'./examples/*.ts', './examples/**/js/*.ts',
		'./examples/*.tsx', './examples/**/*.tsx',
	])
		.pipe(typescript({
			noImplicitAny: true,
			module: 'commonjs',
			jsx: 'react'
		}));
	return tsResult.js
		.pipe(gulp.dest('build/examples/'));
});

gulp.task('build', ['build-test', 'build-src', 'build-examples']);


gulp.task('sass', function(){
	gulp.src('./build/examples/todomvc-request-response/css/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./build/examples/todomvc-request-response/css/'));
		// .pipe(livereload());
});

gulp.task('server', function() {
	connect.server({
		livereload: true
	});
	gulp.watch([
		'./examples/*.*',
		'./build/examples/**/*.html',
		'./build/examples/**/*.css',
		'./build/examples/**/**/*.css',
		'./examples/**/*.*',
		'./build/test-in-browser/*.*'
	], [
		'livereload'
	]);
});

gulp.task('livereload', function(){
	gulp.src([
		'./examples/*.*',
		'./examples/**/*.*',
		'./build/examples/**/*.html',
		'./build/examples/**/**/*.css',
		'./build/test-in-browser/*.*',
	])
	    .pipe(connect.reload());
});

gulp.task('watch', function(){
	gulp.watch(['./src/*.ts', './src/**/*.ts'], ['build-src']);
	gulp.watch(['./examples/*.ts', './examples/**/*.ts'], ['build-examples']);
	gulp.watch('./build/src/*.js', ['test']);
	gulp.watch('./build/test/*.js', ['test']);
	gulp.watch('./test/*.ts', ['build-test']);
	gulp.watch('./test-in-browser/*.ts', ['build-test-in-browser']);

	gulp.watch('./build/examples/todomvc/test/*.js', ['test-todomvc']);


	gulp.watch('./build/examples/todomvc-request-response/css/*.scss', ['sass']);

});
