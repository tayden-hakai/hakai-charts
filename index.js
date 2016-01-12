/**
 * The global namespace for all charts
 * @namespace hakaiCharts
 */
const hakaiCharts = {
  parallelCoordinates: require('./src/js/parallel_coordinates'),
  scatterplot: require('./src/js/scatterplot'),
};

module.exports = hakaiCharts;
