const path = require('path');

module.exports = {
  devtool: 'eval',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'hakai_charts.min.js',
    library: 'hakaiCharts',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', exclude: /node_modules/ },
      { test: /\.s?css$/, loader: 'style!css!sass' },
    ],
  },
  debug: true,
};
