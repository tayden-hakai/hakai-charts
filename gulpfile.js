/* eslint-env node */

const fs = require('fs');
const gulp = require('gulp');

const browserify = require('browserify');
const watchify = require('watchify');

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('utils-merge');

const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
// const sourcemaps = require('gulp-sourcemaps');

const eslint = require('gulp-eslint');

const pkg = JSON.parse(fs.readFileSync('package.json'));

function bundle(bundler) {
  return bundler.transform('babelify', { presets: ['es2015'] }).bundle()
    .on('error', console.error)
    .pipe(source(pkg.main))
    .pipe(buffer())
    .pipe(rename('hakai_charts.js'))
    .pipe(gulp.dest('build'));
}

// Build development library
gulp.task('build-dev', ['lint'], function buildBundle() {
  const bundler = browserify(pkg.main, { debug: true });
  return bundle(bundler);
});

// Build development library and rebuild if files change
gulp.task('watchify', ['lint'], function watchBundle() {
  const args = merge(watchify.args, { debug: true });
  const bundler = watchify(browserify(pkg.main, args));
  bundle(bundler);

  bundler.on('update', function updateBundle() {
    bundle(bundler);
  });
});

// Build production library without sourcemaps
gulp.task('build-prod', ['lint'], function buildProductionBundle() {
  const bundler = browserify(pkg.main, { standalone: 'hakaiCharts' });

  return bundler.transform('babelify', { presets: ['es2015'] }).bundle()
    .on('error', console.error)
    .pipe(source(pkg.main))
    .pipe(buffer())
    .pipe(rename('hakai_charts.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

// JS linting task for code quality check
gulp.task('lint', function lintJS() {
  gulp.src(['./src/js/**/*.js', './*.js'])
    .pipe(eslint())
    .pipe(eslint.formatEach());
});

gulp.task('default', ['watchify']);
gulp.task('build', ['build-prod']);
