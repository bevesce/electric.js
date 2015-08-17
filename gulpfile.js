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

gulp.task('build-server', function() {
	var tsResult = gulp.src(['./src/*.ts', './src/**/*.ts'])
		.pipe(typescript({
			noImplicitAny: true,
			module: 'commonjs'
		}));
	return tsResult.js.pipe(gulp.dest('build/server/'));
});

gulp.task('build-client', function() {
	var tsResult = gulp.src(['./src/*.ts', './src/**/*.ts'])
		.pipe(typescript({
			noImplicitAny: true,
			module: 'amd',
			jsx: 'react'
		}));
	return tsResult.js.pipe(gulp.dest('build/client/'));
});

gulp.task('build', ['build-test', 'build-server', 'build-client']);


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
		['./examples/*.*', './examples/**/*.*'],
		['livereload']);
});

gulp.task('livereload', function(){
	gulp.src([
		'./examples/*.html', './examples/*.css', './examples/*.js',
		'./examples/receivers/*.js', './examples/receivers/*.html'
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
	gulp.watch(['./src/*.ts', './src/**/*.ts'], ['build-server']);
	gulp.watch(['./src/*.ts', './src/**/*.ts'], ['build-client']);
	gulp.watch('./build/server/*.js', ['test']);
	gulp.watch('./build/test/*.js', ['test']);
	gulp.watch('./test/*.ts', ['build-test']);
});

// gulp.task('default', ['server', 'watch']);

