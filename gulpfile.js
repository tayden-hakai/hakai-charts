const fs = require('fs');
const gulp = require('gulp');
const jsdoc = require('gulp-jsdoc-to-markdown');
const concat = require('gulp-concat');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const gutil = require('gulp-util');

const pkg = JSON.parse(fs.readFileSync('package.json'));
const webpackConfig = require('./webpack.config.js');

// Generate README documentation from JSDoc comments
gulp.task('document', function document() {
  gulp.src([pkg.main, './src/js/**/*.js', '!./src/js/**/_*.js'])
    .pipe(concat('README.md'))
    .pipe(jsdoc())
    .pipe(gulp.dest('.'));
});

gulp.task('webpack', function buildProd() {
  webpack(webpackConfig);
});

gulp.task('webpack-dev-server', function webpackServer() {
  const conf = webpackConfig;
  conf.devtool = 'source-map';
  // Start a webpack-dev-server
  const compiler = webpack(conf);

  new WebpackDevServer(
    compiler,
    { contentBase: './', hot: true }
  )
    .listen(8080, 'localhost', function onServe(err) {
      if (err) throw new gutil.PluginError('webpack-dev-server', err);
      // Server listening
      gutil.log('[webpack-dev-server]', 'http://localhost:8080');
    });
});

gulp.task('default', ['webpack-dev-server']);
gulp.task('build', ['webpack']);
