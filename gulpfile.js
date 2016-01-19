const gulp = require('gulp');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const gutil = require('gulp-util');

const webpackConfig = require('./webpack.config.js');

gulp.task('webpack', function buildProd(callback) {
  webpack(webpackConfig, function compileProd(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString());
    callback();
  });
});

gulp.task('webpack-dev-server', function webpackServer() {
  const conf = webpackConfig;
  conf.devtool = 'source-map';

  const compiler = webpack(conf, function compileDev(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack-dev-server]', stats.toString());
  });

  compiler.call(undefined);

  // Start a webpack-dev-server
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
