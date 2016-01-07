/* eslint-env node */
const fs = require('fs');
const gulp = require('gulp');

const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('utils-merge');

const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

const eslint = require('gulp-eslint');

const pkg = JSON.parse(fs.readFileSync('package.json'));

function bundle(bundler) {
  return bundler.bundle()
    .on('error', console.error)
    .pipe(source(pkg.main))
    .pipe(buffer())
    .pipe(rename('hakai_charts.js'))
    .pipe(gulp.dest('build'))
    .pipe(rename('hakai_charts.min.js'))
    .pipe(sourcemaps.init({ loadMaps: true }))
      // capture sourcemaps from transforms
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build'));
}

gulp.task('watchify', function watchBundle() {
  const args = merge(watchify.args, { debug: true });
  const bundler = watchify(browserify('./index.js', args))
      .transform(babelify, { /* opts */ });
  bundle(bundler);

  bundler.on('update', function updateBundle() {
    bundle(bundler);
  });
});

// Without watchify
gulp.task('browserify', ['lint'], function buildBundle() {
  const bundler = browserify('./index.js', { debug: true })
      .transform(babelify, {/* options */ });

  return bundle(bundler);
});

// Without sourcemaps
gulp.task('browserify-production', ['lint'], function buildProductionBundle() {
  const bundler = browserify('./index.js', { standalone: 'hakaiCharts' })
      .transform(babelify, {/* options */ });

  return bundler.bundle()
    .on('error', console.error)
    .pipe(source(pkg.main))
    .pipe(buffer())
    .pipe(rename('hakai_charts.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('hakai_charts.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

// JS linting task for code quality check
gulp.task('lint', function lintJS() {
  gulp.src(['./app/static/scripts/**/*.js', './app/routes/**/*.js', './*.js'])
    .pipe(eslint())
    .pipe(eslint.formatEach());
});

gulp.task('default', ['watchify']);
