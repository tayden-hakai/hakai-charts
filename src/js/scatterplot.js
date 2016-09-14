// Load stylesheet
require('../styles/scatterplot.scss');

import { extent } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleLog, schemeCategory10 } from 'd3-scale';
import { select } from 'd3-selection';

import * as ss from 'simple-statistics';

/**
 * A reusable d3 scatterplot generator
 * @name scatterplot
 * @module scatterplot
 * @memberof hakaiCharts
 * @author Taylor Denouden
 * @see {@link https://cdn.rawgit.com/tayden/hakai-charts/master/examples/scatterplot_example.html|example}
 * @param {String|DOM_node} parent A DOM element to append the chart to
 * @return {object} scatterplot chart
 */
function scatterplot(parent) {
  let _width;
  let _height;
  let _margin;
  let _data;
  let _x = scaleLinear();
  let _y = scaleLinear();
  let _xLog = false;
  let _yLog = false;
  let _xAxis;
  let _yAxis;
  let _xAccessor = d => d.x;
  let _yAccessor = d => d.y;
  let _xLabel;
  let _yLabel;
  let _color = schemeCategory10;
  let _colorAccessor = () => 0;
  let _keyAccessor = d => d.key;
  let _radius = 5;
  let _regLine;
  let _rSquared = 1;
  let _correlation = 1;
  let _covariance = 1;
  let _svg;

  /**
   * Return the base ten log of a Number
   * @private
   * @param {number} d - A number to apply the operation on
   * @return {number} log base 10 of d
   */
  function log10(d) {
    return Math.log(d) / Math.log(10);
  }

  /**
   * Given an x value of un-transformed data (no log transform etc.),
   * get the untransformed y coordinate from the regression line
   * @private
   * @param {number} x - The untransformed x value in linear space
   * @param {function} regLine - The regression line calculated using
   *    a transformed dataset that accounted for the log scales
   * @return {number} y - The untransformed y value in linear space to plot on the chart
   */
  function getY(x, regLine) {
    const y = regLine(_xLog ? log10(x) : x);
    return _yLog ? Math.pow(10, y) : y;
  }

  /**
   * Calculate all chart statistical values and regresslion linearRegression
   * @private
   * @param {Object[]} data - The dataset used to calculate the statistics
   * @return {Object} stats - An object with all calculated statistics
   */
  function calculateStats(data) {
    // Get regression line formula
    const ssData = data.map(function ssData(d) {
      const xD = _xLog ? log10(_xAccessor(d)) : _xAccessor(d);
      const yD = _yLog ? log10(_yAccessor(d)) : _yAccessor(d);
      return [xD, yD];
    });
    const mb = ss.linearRegression(ssData);
    const regLine = ss.linearRegressionLine(mb);

    // Calculated statistics
    const rSqrd = ss.rSquared(ssData, regLine);
    const correlation = ss.sampleCorrelation(
      ssData.map(d => d[0]),
      ssData.map(d => d[1])
    );
    const covariance = ss.sampleCovariance(
      ssData.map(d => d[0]),
      ssData.map(d => d[1])
    );

    return {
      reg: mb,
      regLine,
      rSqrd,
      correlation,
      covariance,
    };
  }

  /**
   * Generate the chart using private variables on call to chart.render()
   * @private
   * @returns {chart}
   */
  function _chart() {
    // Create svg object
    _svg = select(parent).append('svg')
      .attr('width', _width + _margin.left + _margin.right)
      .attr('height', _height + _margin.top + _margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

    // Create cleaned dataset that doesn't include non numeric or log(0) values
    const cleanData = _data
        .filter(d => !(isNaN(_xAccessor(d)) || isNaN(_yAccessor(d))))
        .filter(d => !((_xLog && _xAccessor(d) === 0) || (_yLog && _yAccessor(d) === 0)));

    // Set x and y axis based on selected attributes
    _x.domain(extent(cleanData, _xAccessor))
      .range([0, _width]);
    _y.domain(extent(cleanData, _yAccessor))
      .range([_height, 0]);

    // Create svg axis generators
    _xAxis = axisBottom()
      .scale(_x)
      .tickSize(-_height);
    _yAxis = axisLeft()
      .scale(_y)
      .tickSize(-_width);

    // Add axes to chart
    _svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + _height + ')')
        .call(_xAxis);
    _svg.append('g')
        .attr('class', 'y axis')
        .call(_yAxis);

    // Add axis labels
    _svg.append('text')
        .attr('class', 'x label')
        .attr('text-anchor', 'end')
        .attr('x', _width - 10)
        .attr('y', _height - 5)
        .text(_xLabel);
    _svg.append('text')
        .attr('class', 'y label')
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'end')
        .attr('x', -7)
        .attr('y', 15)
        .text(_yLabel);

    // Add frame around chart
    _svg.append('rect')
        .attr('class', 'frame')
        .attr('width', _width)
        .attr('height', _height);

    // Create clip path
    _svg.append('defs')
      .append('clipPath')
        .attr('id', 'chartClip')
      .append('rect')
        .attr('width', _width)
        .attr('height', _height);

    // Calculate statistics and regression line
    const stats = calculateStats(cleanData);
    _regLine = stats.regLine;
    _rSquared = stats.rSqrd;
    _correlation = stats.correlation;
    _covariance = stats.covariance;

    // Add regression line to Chart
    _svg.append('g')
        .attr('class', 'regression')
        .attr('clip-path', 'url(#chartClip)')
      .append('line')
        .style('stroke', 'black')
        .style('stroke-width', '1')
        .style('stroke-dasharray', '5,5,10,5')
        .attr('x1', _x(_x.domain()[0]))
        .attr('y1', _y(getY(_x.domain()[0], _regLine)))
        .attr('x2', _x(_x.domain()[1]))
        .attr('y2', _y(getY(_x.domain()[1], _regLine)));

    // Add data marks to chart
    const marks = _svg.selectAll('g.mark')
        .data(cleanData)
      .enter().append('g')
        .attr('class', 'mark');

    marks.append('circle')
        .attr('cx', d => _x(_xAccessor(d)))
        .attr('cy', d => _y(_yAccessor(d)))
        .attr('r', _radius)
        .attr('fill', d => _color(_colorAccessor(d)));

    marks.append('text')
        .text(_keyAccessor)
        .attr('x', d => _x(_xAccessor(d)))
        .attr('y', d => _y(_yAccessor(d)))
        .attr('text-anchor', 'end')
        .attr('dy', -5)
        .attr('dx', -2);
  }

  /**
   * Draw the chart after parameters have been set.
   * @name render
   * @instance
   * @method
   * @return {chart}
   */
  _chart.render = function render() {
    this.call();
    return _chart;
  };

  /**
   * Redraw and transform the chart after parameter changes.
   * @name redraw
   * @instance
   * @method
   * @return {chart}
   */
  _chart.redraw = function redraw() {
    // Create cleaned dataset that doesn't include non numeric or log(0) values
    const cleanData = _data
        .filter(d => !(isNaN(_xAccessor(d)) || isNaN(_yAccessor(d))))
        .filter(d => !((_xLog && _xAccessor(d) === 0) || (_yLog && _yAccessor(d) === 0)));

    // Update x and y domain
    _x.domain(extent(cleanData, _xAccessor))
      .range([0, _width]);
    _y.domain(extent(cleanData, _yAccessor))
      .range([_height, 0]);

    // Update axes generator scale
    _xAxis.scale(_x);
    _yAxis.scale(_y);

    // Define consistent transition duration
    const t = 1500;

    // Update axes
    _svg.select('.x.axis')
        .transition().duration(t)
        .call(_xAxis);
    _svg.select('.y.axis')
        .transition().duration(t)
        .call(_yAxis);

    // Update axis labels
    _svg.select('.x.label')
        .text(_xLabel);
    _svg.select('.y.label')
        .text(_yLabel);

    // Calculate statistics and regression line
    const stats = calculateStats(cleanData);
    _regLine = stats.regLine;
    _rSquared = stats.rSqrd;
    _correlation = stats.correlation;
    _covariance = stats.covariance;

    // Add regression line to Chart
    _svg.select('.regression line')
      .transition().duration(t)
        .attr('x1', _x(_x.domain()[0]))
        .attr('y1', _y(getY(_x.domain()[0], _regLine)))
        .attr('x2', _x(_x.domain()[1]))
        .attr('y2', _y(getY(_x.domain()[1], _regLine)));

    // Update data and mark positions
    const marks = _svg.selectAll('g.mark')
        .data(cleanData, _keyAccessor);

    // Update
    marks.selectAll('circle')
      .transition().duration(t)
        .attr('cx', d => _x(_xAccessor(d)))
        .attr('cy', d => _y(_yAccessor(d)))
        .attr('r', _radius)
        .attr('fill', d => _color(_colorAccessor(d)));

    marks.selectAll('text')
      .transition().duration(t)
        .attr('x', d => _x(_xAccessor(d)))
        .attr('y', d => _y(_yAccessor(d)));

    // Enter
    const g = marks.enter().append('g')
        .attr('class', 'mark');

    g.append('circle')
        .attr('cx', d => _x(_xAccessor(d)))
        .attr('cy', d => _y(_yAccessor(d)))
        .attr('r', _radius)
        .attr('fill', d => _color(_colorAccessor(d)));

    g.append('text')
        .text(_keyAccessor)
        .attr('x', d => _x(_xAccessor(d)))
        .attr('y', d => _y(_yAccessor(d)))
        .attr('text-anchor', 'end')
        .attr('dy', -5)
        .attr('dx', -2);

    // Exit
    marks.exit().remove();

    return _chart;
  };

  /**
   * Set the width attribute of a chart.
   * @name width
   * @instance
   * @param {int} [val] The chart width
   * @return {chart}
   */
  /**
   * Get the width attribute of a chart.
   * @name width
   * @instance
   * @return {int}
   */
  _chart.width = function width(val) {
    if (!arguments.length) { return _width; }
    _width = val;
    return _chart;
  };

  /**
   * Set the height attribute of a chart.
   * @name height
   * @instance
   * @param {int} [val] The chart height
   * @return {chart}
   */
  /**
   * Get the height attribute of a chart.
   * @name height
   * @instance
   * @return {int}
   */
  _chart.height = function height(val) {
    if (!arguments.length) { return _height; }
    _height = val;
    return _chart;
  };

  /**
   * Set the margin attribute of a chart.
   * @name margin
   * @instance
   * @param {Object} [val] The chart margins in format {top: 5, left: 5, right: 10, bottom: 15}
   * @return {chart}
   */
  /**
   * Get the margin attribute of a chart.
   * @name margin
   * @instance
   * @return {Object}
   */
  _chart.margin = function margin(val) {
    if (!arguments.length) { return _margin; }
    _margin = val;
    return _chart;
  };

  /**
   * Set the data that accessor functions refer to.
   * @name data
   * @instance
   * @param {Object[]} [val] JSON data being accessed by all accessor functions
   * @return {chart}
   */
  /**
   * Get the data that accessor functions refer to.
   * @name data
   * @instance
   * @return {Object[]}
   */
  _chart.data = function data(val) {
    if (!arguments.length) { return _data; }
    _data = val;
    return _chart;
  };

  /**
   * Set the function used to access the data shown on the x axis.
   * @name xAccessor
   * @instance
   * @param {Function|Number} [val] The x axis data accessor function
   * @return {chart}
   */
  /**
   * Get the function used to access the data shown on the x axis.
   * @name xAccessor
   * @instance
   * @return {Function|Number} The x axis data accessor
   */
  _chart.xAccessor = function xAccessor(val) {
    if (!arguments.length) { return _xAccessor; }
    _xAccessor = val;
    return _chart;
  };

  /**
   * Set the function used to access the data shown on the y axis.
   * @name yAccessor
   * @instance
   * @param {Function|Number} [val] The y axis data accessor function
   * @return {chart}
   */
  /**
   * Get the function used to access the data shown on the y axis.
   * @name yAccessor
   * @instance
   * @return {Function|Number} The y axis data accessor
   */
  _chart.yAccessor = function yAccessor(val) {
    if (!arguments.length) { return _yAccessor; }
    _yAccessor = val;
    return _chart;
  };

  /**
   * Set the x axis label.
   * @name xLabel
   * @instance
   * @param {String} [val] The x label
   * @return {chart}
   */
  /**
   * Get the x axis label.
   * @name xLabel
   * @instance
   * @return {String}
   */
  _chart.xLabel = function xLabel(val) {
    if (!arguments.length) { return _xLabel; }
    _xLabel = val;
    return _chart;
  };

  /**
   * Set the y axis label.
   * @name yLabel
   * @instance
   * @param {String} [val] The y label
   * @return {chart}
   */
  /**
   * Get the y axis label.
   * @name yLabel
   * @instance
   * @return {String}
   */
  _chart.yLabel = function yLabel(val) {
    if (!arguments.length) { return _yLabel; }
    _yLabel = val;
    return _chart;
  };

  /**
   * Set the x axis scale as log transformed or not.
   * @name xLog
   * @instance
   * @param {Boolean} [val=false] Flag to transform x axis
   * @return {chart}
   */
  /**
   * Get boolean of whether the x axis scale is log transformed.
   * @name xLog
   * @instance
   * @return {Boolean}
   */
  _chart.xLog = function xLog(val) {
    if (!arguments.length) { return _xLog; }
    _xLog = val;
    _x = _xLog ? scaleLog() : scaleLinear();
    return _chart;
  };

  /**
   * Set the y axis scale as log transformed or not.
   * @name yLog
   * @instance
   * @param {Boolean} [val=false] Flag to transform y axis
   * @return {chart}
   */
  /**
   * Get boolean of whether the y axis scale is log transformed.
   * @name yLog
   * @instance
   * @return {Boolean}
   */
  _chart.yLog = function yLog(val) {
    if (!arguments.length) { return _yLog; }
    _yLog = val;
    _y = _yLog ? scaleLog() : scaleLinear();
    return _chart;
  };

  /**
   * Set the color scale function that accepts a data value and returns a color.
   * @name color
   * @instance
   * @param {Function} [val=schemeCategory10] The color scale function
   * @return {chart}
   */
  /**
   * Get the color scale function
   * @name color
   * @instance
   * @return {Function}
   */
  _chart.color = function color(val) {
    if (!arguments.length) { return _color; }
    _color = val;
    return _chart;
  };

  /**
   * Set the function used to access the data and pass the value to the color function.
   * @name colorAccessor
   * @instance
   * @param {Function} [val=function(){ return 0; }] The colorAccessor function
   * @return {chart}
   */
  /**
   * Get the function used to access the data point color.
   * @name colorAccessor
   * @instance
   * @return {Function}
   */
  _chart.colorAccessor = function colorAccessor(val) {
    if (!arguments.length) { return _colorAccessor; }
    _colorAccessor = val;
    return _chart;
  };

  /**
   * Set a function used to determine which points shown are the same data point.
   * Allows for mark translation on redraw.
   * @name keyAccessor
   * @instance
   * @param {Function} [val=function(d){ return d.key; }] The keyAccessor function
   * @return {chart}
   */
  /**
   * Get the function used to determine which points shown are the same datum.
   * @name keyAccessor
   * @instance
   * @return {int}
   */
  _chart.keyAccessor = function keyAccessor(val) {
    if (!arguments.length) { return _keyAccessor; }
    _keyAccessor = val;
    return _chart;
  };

  /**
   * Set the radius value of the scatterplot
   * @name radius
   * @instance
   * @param {Number} [val=5] The radius in px
   * @return {chart}
   */
  /**
   * Get the radius value of the scatterplot
   * @name radius
   * @instance
   * @return {int|Function}
   */
  _chart.radius = function radius(val) {
    if (!arguments.length) { return _radius; }
    _radius = val;
    return _chart;
  };

  /**
   * Return the R squared value determined by the linear regression function.
   * @name rSquared
   * @instance
   * @return {float}
   */
  _chart.rSquared = function rSquared() {
    return _rSquared;
  };

  /**
   * Return the correlation value determined by the linear regression function.
   * @name correlation
   * @instance
   * @return {float}
   */
  _chart.correlation = function correlation() {
    return _correlation;
  };

  /**
   * Return the covariance value determined by the linear regression function.
   * @name covariance
   * @instance
   * @return {float}
   */
  _chart.covariance = function covariance() {
    return _covariance;
  };

  return _chart;
}

export default scatterplot;
