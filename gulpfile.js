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

gulp.task('build-test', function() {
	var tsResult = gulp.src('./test/*.ts')
		.pipe(typescript({
			noImplicitAny: true,
			module: 'commonjs'
		}));
	return tsResult.js.pipe(gulp.dest('build/test/'));
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


// gulp.task('sass', function(){
// 	gulp.src('./styles/*.scss')
// 		.pipe(sass().on('error', sass.logError))
// 		.pipe(gulp.dest('build/styles/'))
// 		.pipe(livereload());
// });

gulp.task('server', function() {
	connect.server({
		livereload: true
	});
	gulp.watch(
		['./examples/*.*', './examples/**/*.*', './test/*.js', './test/**.html'],
		['livereload']);
});

gulp.task('livereload', function(){
	gulp.src([
		'./examples/*.html',
		'./examples/*.css',
		'./examples/*.js',
		'./examples/**/*.js',
		'./examples/**/*.html',
		'./examples/**/*.css',
		'./test/*.js',
		'./test/*.html'
	])
	    .pipe(connect.reload());
});

// gulp.task('inject', function(){
// 	var target = gulp.src('./build/index.html');
// 	var sources = gulp.src(['./build/scripts/*.js', './build/styles/*.css'], {read: false});

// 	return target.pipe(inject(sources))
// 		.pipe(gulp.dest('./build'));
// });

gulp.task('wtest', function(){
	gulp.watch(['./src/*.ts', './src/**/*.ts'], ['build-src']);
	gulp.watch(['./examples/*.ts', './examples/**/*.ts'], ['build-examples']);
	gulp.watch('./build/src/*.js', ['test']);
	gulp.watch('./build/test/*.js', ['test']);
	gulp.watch('./test/*.ts', ['build-test']);
});

// gulp.task('default', ['server', 'watch']);

