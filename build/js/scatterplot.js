'use strict';
/* global d3 ss */
/* eslint-env browser */

/**
 * A reusable d3 scatterplot generator
 * @name scatterplot
 * @author Taylor Denouden
 * @param {string} parent | {DOM element} parent - A dom element to append the vis to
 * @return {object} scatterplot
 */

module.exports = function (parent) {
  var _width;
  var _height;
  var _margin;
  var _data;
  var _x = d3.scale.linear();
  var _y = d3.scale.linear();
  var _xLog = false;
  var _yLog = false;
  var _xAxis;
  var _yAxis;
  var _xAccessor;
  var _yAccessor;
  var _xLabel;
  var _yLabel;
  var _color = d3.scale.category10();
  var _colorAccessor = function _colorAccessor() {
    return 0;
  };
  var _keyAccessor = function _keyAccessor(d) {
    return d.key;
  };
  var _radius = 5;
  var _regLine;
  var _rSquared = 1;
  var _correlation = 1;
  var _covariance = 1;
  var _svg;

  function _chart() {
    // Create svg object
    _svg = d3.select(parent).append('svg').attr('width', _width + _margin.left + _margin.right).attr('height', _height + _margin.top + _margin.bottom).append('g').attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

    // Create cleaned dataset that doesn't include non numeric or log(0) values
    var cleanData = _data.filter(function (d) {
      return !(isNaN(_xAccessor(d)) || isNaN(_yAccessor(d)));
    }).filter(function (d) {
      return !(_xLog && _xAccessor(d) === 0 || _yLog && _yAccessor(d) === 0);
    });

    // Set x and y axis based on selected attributes
    _x.domain(d3.extent(cleanData, _xAccessor)).range([0, _width]);
    _y.domain(d3.extent(cleanData, _yAccessor)).range([_height, 0]);

    // Create svg axis generators
    _xAxis = d3.svg.axis().scale(_x).orient('bottom').tickSize(-_height);
    _yAxis = d3.svg.axis().scale(_y).orient('left').tickSize(-_width);

    // Add axes to chart
    _svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0, ' + _height + ')').call(_xAxis);
    _svg.append('g').attr('class', 'y axis').call(_yAxis);

    // Add axis labels
    _svg.append('text').attr('class', 'x label').attr('text-anchor', 'end').attr('x', _width - 10).attr('y', _height - 5).text(_xLabel);
    _svg.append('text').attr('class', 'y label').attr('transform', 'rotate(-90)').attr('text-anchor', 'end').attr('x', -5).attr('y', 10).text(_yLabel);

    // Add frame around chart
    _svg.append('rect').attr('class', 'frame').attr('width', _width).attr('height', _height);

    // Create clip path
    _svg.append('defs').append('clipPath').attr('id', 'chartClip').append('rect').attr('width', _width).attr('height', _height);

    // Calculate statistics and regression line
    var stats = calculateStats(cleanData);
    _regLine = stats.regLine;
    _rSquared = stats.rSquared;
    _correlation = stats.correlation;
    _covariance = stats.covariance;

    // Add regression line to Chart
    _svg.append('g').attr('class', 'regression').attr('clip-path', 'url(#chartClip)').append('line').style('stroke', 'black').style('stroke-width', '1').style('stroke-dasharray', '5,5,10,5').attr('x1', _x(_x.domain()[0])).attr('y1', _y(getY(_x.domain()[0], _regLine))).attr('x2', _x(_x.domain()[1])).attr('y2', _y(getY(_x.domain()[1], _regLine)));

    // Add data marks to chart
    var marks = _svg.selectAll('g.mark').data(cleanData).enter().append('g').attr('class', 'mark');

    marks.append('circle').attr('cx', function (d) {
      return _x(_xAccessor(d));
    }).attr('cy', function (d) {
      return _y(_yAccessor(d));
    }).attr('r', _radius).attr('fill', function (d) {
      return _color(_colorAccessor(d));
    });

    marks.append('text').text(_keyAccessor).attr('x', function (d) {
      return _x(_xAccessor(d));
    }).attr('y', function (d) {
      return _y(_yAccessor(d));
    }).attr('text-anchor', 'end').attr('dy', -5).attr('dx', -2);
  }

  _chart.render = function () {
    this.call();
    return _chart;
  };
  _chart.redraw = function () {
    // Create cleaned dataset that doesn't include non numeric or log(0) values
    var cleanData = _data.filter(function (d) {
      return !(isNaN(_xAccessor(d)) || isNaN(_yAccessor(d)));
    }).filter(function (d) {
      return !(_xLog && _xAccessor(d) === 0 || _yLog && _yAccessor(d) === 0);
    });

    // Update x and y domain
    _x.domain(d3.extent(cleanData, _xAccessor)).range([0, _width]);
    _y.domain(d3.extent(cleanData, _yAccessor)).range([_height, 0]);

    // Update axes generator scale
    _xAxis.scale(_x);
    _yAxis.scale(_y);

    // Define consistent transition duration
    var t = 1500;

    // Update axes
    _svg.select('.x.axis').transition().duration(t).call(_xAxis);
    _svg.select('.y.axis').transition().duration(t).call(_yAxis);

    // Update axis labels
    _svg.select('.x.label').text(_xLabel);
    _svg.select('.y.label').text(_yLabel);

    // Calculate statistics and regression line
    var stats = calculateStats(cleanData);
    _regLine = stats.regLine;
    _rSquared = stats.rSquared;
    _correlation = stats.correlation;
    _covariance = stats.covariance;

    // Add regression line to Chart
    _svg.select('.regression line').transition().duration(t).attr('x1', _x(_x.domain()[0])).attr('y1', _y(getY(_x.domain()[0], _regLine))).attr('x2', _x(_x.domain()[1])).attr('y2', _y(getY(_x.domain()[1], _regLine)));

    // Update data and mark positions
    var marks = _svg.selectAll('g.mark').data(cleanData, _keyAccessor);

    // Update
    marks.selectAll('circle').transition().duration(t).attr('cx', function (d) {
      return _x(_xAccessor(d));
    }).attr('cy', function (d) {
      return _y(_yAccessor(d));
    }).attr('r', _radius).attr('fill', function (d) {
      return _color(_colorAccessor(d));
    });

    marks.selectAll('text').transition().duration(t).attr('x', function (d) {
      return _x(_xAccessor(d));
    }).attr('y', function (d) {
      return _y(_yAccessor(d));
    });

    // Enter
    var g = marks.enter().append('g').attr('class', 'mark');

    g.append('circle').attr('cx', function (d) {
      return _x(_xAccessor(d));
    }).attr('cy', function (d) {
      return _y(_yAccessor(d));
    }).attr('r', _radius).attr('fill', function (d) {
      return _color(_colorAccessor(d));
    });

    g.append('text').text(_keyAccessor).attr('x', function (d) {
      return _x(_xAccessor(d));
    }).attr('y', function (d) {
      return _y(_yAccessor(d));
    }).attr('text-anchor', 'end').attr('dy', -5).attr('dx', -2);

    // Exit
    marks.exit().remove();

    return _chart;
  };
  _chart.width = function (val) {
    if (!arguments.length) {
      return _width;
    }
    _width = val;
    return _chart;
  };
  _chart.height = function (val) {
    if (!arguments.length) {
      return _height;
    }
    _height = val;
    return _chart;
  };
  _chart.margin = function (val) {
    if (!arguments.length) {
      return _margin;
    }
    _margin = val;
    return _chart;
  };
  _chart.data = function (val) {
    if (!arguments.length) {
      return _data;
    }
    _data = val;
    return _chart;
  };
  _chart.xAccessor = function (val) {
    if (!arguments.length) {
      return _xAccessor;
    }
    _xAccessor = val;
    return _chart;
  };
  _chart.yAccessor = function (val) {
    if (!arguments.length) {
      return _yAccessor;
    }
    _yAccessor = val;
    return _chart;
  };
  _chart.xLabel = function (val) {
    if (!arguments.length) {
      return _xLabel;
    }
    _xLabel = val;
    return _chart;
  };
  _chart.yLabel = function (val) {
    if (!arguments.length) {
      return _yLabel;
    }
    _yLabel = val;
    return _chart;
  };
  _chart.xLog = function (val) {
    if (!arguments.length) {
      return _xLog;
    }
    _xLog = val;
    _x = _xLog ? d3.scale.log() : d3.scale.linear();
    return _chart;
  };
  _chart.yLog = function (val) {
    if (!arguments.length) {
      return _yLog;
    }
    _yLog = val;
    _y = _yLog ? d3.scale.log() : d3.scale.linear();
    return _chart;
  };
  _chart.color = function (val) {
    if (!arguments.length) {
      return _color;
    }
    _color = val;
    return _chart;
  };
  _chart.colorAccessor = function (val) {
    if (!arguments.length) {
      return _colorAccessor;
    }
    _colorAccessor = val;
    return _chart;
  };
  _chart.keyAccessor = function (val) {
    if (!arguments.length) {
      return _keyAccessor;
    }
    _keyAccessor = val;
    return _chart;
  };
  _chart.radius = function (val) {
    if (!arguments.length) {
      return _radius;
    }
    _radius = val;
    return _chart;
  };
  _chart.rSquared = function () {
    return _rSquared;
  };
  _chart.correlation = function () {
    return _correlation;
  };
  _chart.covariance = function () {
    return _covariance;
  };

  return _chart;

  /**
   * Return the base ten log of a Number
   * @param {number} d - A number to apply the operation on
   * @return {number} log base 10 of d
   */
  function log10(d) {
    return Math.log(d) / Math.log(10);
  }

  /**
   * Given an x value of un-transformed data (no log transform etc.),
   * get the untransformed y coordinate from the regression line
   * @param {number} x - The untransformed x value in linear space
   * @param {function} regLine - The regression line calculated using
   *    a transformed dataset that accounted for the log scales
   * @return {number} y - The untransformed y value in linear space to plot on the chart
   */
  function getY(x, regLine) {
    var y = regLine(_xLog ? log10(x) : x);
    return _yLog ? Math.pow(10, y) : y;
  }

  /**
   * Calculate all chart statistical values and regresslion linearRegression
   * @param {Object[]} data - The dataset used to calculate the statistics
   * @return {Object} stats - An object with all calculated statistics
   */
  function calculateStats(data) {
    // Get regression line formula
    var ssData = data.map(function (d) {
      var xD = _xLog ? log10(_xAccessor(d)) : _xAccessor(d);
      var yD = _yLog ? log10(_yAccessor(d)) : _yAccessor(d);
      return [xD, yD];
    });
    var mb = ss.linearRegression(ssData);
    var regLine = ss.linearRegressionLine(mb);

    // Calculated statistics
    var rSquared = ss.rSquared(ssData, regLine);
    var correlation = ss.sampleCorrelation(ssData.map(function (d) {
      return d[0];
    }), ssData.map(function (d) {
      return d[1];
    }));
    var covariance = ss.sampleCovariance(ssData.map(function (d) {
      return d[0];
    }), ssData.map(function (d) {
      return d[1];
    }));

    return {
      reg: mb,
      regLine: regLine,
      rSquared: rSquared,
      correlation: correlation,
      covariance: covariance
    };
  }
};
//# sourceMappingURL=scatterplot.js.map
