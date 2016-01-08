/* eslint-env node */
const fs = require('fs');
const gulp = require('gulp');

const browserify = require('browserify');
const watchify = require('watchify');
const babel = require('gulp-babel');

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
  const bundler = watchify(browserify('./build/hakai_charts.js', args));
  bundle(bundler);

  bundler.on('update', function updateBundle() {
    bundle(bundler);
  });
});

// Without watchify
gulp.task('browserify', ['lint'], function buildBundle() {
  const bundler = browserify('./build/hakai_charts.js', { debug: true });
  return bundle(bundler);
});

// Without sourcemaps
gulp.task('browserify-production', ['babel'], function buildProductionBundle() {
  const bundler = browserify('./build/hakai_charts.js', { standalone: 'hakaiCharts' });

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

// Transpile ES6 into ES5
gulp.task('babel', ['lint'], function transpileJS() {
  gulp.src(['./src/**/*.js'])
    .pipe(sourcemaps.init())
      .pipe(babel({ presets: ['es2015'] }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build'));
});

// JS linting task for code quality check
gulp.task('lint', function lintJS() {
  gulp.src(['./src/js/**/*.js', './*.js'])
    .pipe(eslint())
    .pipe(eslint.formatEach());
});

gulp.task('default', ['watchify']);
gulp.task('build', ['browserify-production']);
// gulp.watch('./src/**/*.js', ['watchify']) ????
