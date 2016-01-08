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

const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');

const eslint = require('gulp-eslint');

const pkg = JSON.parse(fs.readFileSync('package.json'));

function bundle(bundler) {
  return bundler.transform('babelify', { presets: ['es2015'] }).bundle()
    .on('error', console.error)
    .pipe(source(pkg.main))
      .pipe(buffer())
      .pipe(rename('hakai_charts.min.js'))
      .pipe(uglify())
    .pipe(gulp.dest('build'));
}

// Build development library
gulp.task('browserify', ['lintJS'], function buildBundle() {
  const bundler = browserify(pkg.main, { debug: true });
  return bundle(bundler);
});

// Build development library and rebuild if files change
gulp.task('watchify', ['lintJS'], function watchBundle() {
  const args = merge(watchify.args, { debug: true });
  const bundler = watchify(browserify(pkg.main, args));
  bundle(bundler);

  bundler.on('update', function updateBundle() {
    bundle(bundler);
  });
});

// Build production library without sourcemaps
gulp.task('browserify-prod', ['lintJS'], function buildProductionBundle() {
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
gulp.task('lintJS', function lintJS() {
  gulp.src(['./src/js/**/*.js', './*.js'])
    .pipe(eslint())
    .pipe(eslint.formatEach());
});

// Compile Sass .scss files into vanilla CSS
gulp.task('sass-prod', function buildSassProd() {
  return gulp.src('./src/styles/index.scss')
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['> 1%', 'Last 2 versions'] }))
    .pipe(rename('hakai_charts.min.css'))
    .pipe(gulp.dest('dist'));
});

// Compile Sass .scss files into vanilla CSS
gulp.task('sass-dev', function buildSassDev() {
  return gulp.src('./src/styles/index.scss')
    .pipe(sourcemaps.init())
      .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
      .pipe(autoprefixer({ browsers: ['> 1%', 'Last 2 versions'] }))
      .pipe(rename({ extname: '.min.css' }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build'));
});

// // Sass linting task for code quality check
// gulp.task('lintSass', function lintJS() {
//   gulp.src(['./src/styles/**/*.scss'])
//     .pipe(eslint())
//     .pipe(eslint.formatEach());
// });

gulp.task('default', ['watchify']);
gulp.task('build-dev', ['browserify', 'sass-dev']);
gulp.task('build', ['browserify-prod', 'sass-prod']);
