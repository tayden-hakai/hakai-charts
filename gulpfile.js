const fs = require('fs');
const gulp = require('gulp');

const browserify = require('browserify');
const watchify = require('watchify');
const eslint = require('gulp-eslint');

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('utils-merge');

const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');

const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const scsslint = require('gulp-scss-lint');

const jsdoc = require('gulp-jsdoc-to-markdown');
const concat = require('gulp-concat');

const pkg = JSON.parse(fs.readFileSync('package.json'));

function bundle(bundler) {
  return bundler
      .transform('babelify', { presets: ['es2015'] })
      .bundle()
    .on('error', console.error)
    .pipe(source(pkg.main))
    .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(rename('hakai_charts.min.js'))
        .pipe(uglify())
      .pipe(sourcemaps.write('./'))
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
gulp.task('sass-prod', ['lintScss'], function buildSassProd() {
  return gulp.src('./src/styles/index.scss')
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['> 1%', 'Last 2 versions'] }))
    .pipe(rename('hakai_charts.min.css'))
    .pipe(gulp.dest('dist'));
});

// Compile Sass .scss files into vanilla CSS
gulp.task('sass-dev', ['lintScss'], function buildSassDev() {
  return gulp.src('./src/styles/index.scss')
    .pipe(sourcemaps.init())
      .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
      .pipe(autoprefixer({ browsers: ['> 1%', 'Last 2 versions'] }))
      .pipe(rename('hakai_charts.min.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build'));
});

// Watch and rebuild sass on change
gulp.task('sass:watch', ['sass-dev'], function rebuildScss() {
  gulp.watch('./src/styles/**/*.scss', ['sass-dev']);
});

// Sass linting task for code quality check
gulp.task('lintScss', function lintScss() {
  gulp.src(['./src/styles/**/*.scss'])
    .pipe(scsslint());
});

// Generate README documentation from JSDoc comments
gulp.task('document', function document() {
  gulp.src([pkg.main, './src/js/**/*.js', '!./src/js/**/_*.js'])
    .pipe(concat('README.md'))
    .pipe(jsdoc())
    .pipe(gulp.dest('.'));
});

gulp.task('default', ['watchify', 'sass:watch']);
gulp.task('build-dev', ['browserify', 'sass-dev']);
gulp.task('build', ['browserify-prod', 'sass-prod']);
