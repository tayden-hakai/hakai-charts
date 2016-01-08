(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.hakaiCharts = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
  parallelCoordinates: require('./js/parallel_coordinates'),
  scatterplot: require('./js/scatterplot')
};


},{"./js/parallel_coordinates":2,"./js/scatterplot":3}],2:[function(require,module,exports){
'use strict';
/* global d3 */
/* eslint-env browser */

/**
 * A reusable d3 parallel coordinates generator with statistical coloring
 * @name parallelCoordinates
 * @author Taylor Denouden
 * @param {string} parent | {DOM element} parent - A dom element to append the vis to
 * @return {object} parallelCoordinates
 */

module.exports = function (parent) {
  var _width;
  var _height;
  var _margin;
  var _svg;
  var _x;
  var _y = {};
  var _dragging = {};
  var _background;
  var _foreground;
  var _dimensions;
  var _line = d3.svg.line();
  var _axis = d3.svg.axis().orient('left');
  var _color = d3.scale.linear().domain([-2, -0.5, 0.5, 2]).range(['#f46d43', '#74add1', '#74add1', '#66bd63']).interpolate(d3.interpolateLab);
  var _data;
  var _lineData;

  /**
   * Generate the chart using private variables on call to chart.render()
   * @returns {void}
   */
  function _chart() {
    _svg = d3.select(parent).append('svg').attr('width', _width + _margin.left + _margin.right).attr('height', _height + _margin.top + _margin.bottom).append('g').attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

    // Create a scale for each dimension
    _data.forEach(function (d) {
      _y[d.name] = (d.scale || d3.scale.linear()).domain(d3.extent(d.data)).range([_height, 0]);
    });

    // Extract the list of _dimensions
    _dimensions = _data.map(function (d) {
      return d.name;
    });
    _x = d3.scale.ordinal().domain(_dimensions).rangePoints([0, _width], 1);

    // Add grey background lines for context.
    _background = _svg.append('g').attr('class', 'background').selectAll('path').data(_lineData).enter().append('path').attr('d', path);

    // Add blue foreground lines for focus.
    _foreground = _svg.append('g').attr('class', 'foreground').selectAll('path').data(_lineData).enter().append('path').attr('d', path);

    // Add a group element for each dimension.
    var g = _svg.selectAll('.dimension').data(_dimensions).enter().append('g').attr('class', 'dimension').attr('transform', function (d) {
      return 'translate(' + _x(d) + ')';
    }).call(d3.behavior.drag().origin(function (d) {
      return { x: _x(d) };
    }).on('dragstart', function (d) {
      _dragging[d] = _x(d);
      _background.attr('visibility', 'hidden');
    }).on('drag', function (d) {
      _dragging[d] = Math.min(_width, Math.max(0, d3.event.x));
      _foreground.attr('d', path);
      _dimensions.sort(function (a, b) {
        return position(a) - position(b);
      });
      _x.domain(_dimensions);
      g.attr('transform', function (b) {
        return 'translate(' + position(b) + ')';
      });
    }).on('dragend', function (d) {
      delete _dragging[d];
      transition(d3.select(this)).attr('transform', 'translate(' + _x(d) + ')');
      transition(_foreground).attr('d', path);
      _background.attr('d', path).transition().delay(500).duration(0).attr('visibility', null);
    }));

    // Add an axis and title.
    g.append('g').attr('class', 'axis').each(function (d) {
      d3.select(this).call(_axis.scale(_y[d]));
    }).on('click', changeColor).append('text').style('text-anchor', 'middle').attr('y', -9).text(function (d) {
      return d;
    });

    // Add and store a brush for each axis.
    g.append('g').attr('class', 'brush').each(function (d) {
      d3.select(this).call(_y[d].brush = d3.svg.brush().y(_y[d]).on('brushstart', brushstart).on('brush', brush));
    }).selectAll('rect').attr('x', -8).attr('width', 16);

    // Color _dimensions by z-score
    changeColor(_dimensions[0]);
  }

  /**
   * Generate the line path for a datum.
   * @param {object} d - An object with axis attributes
   * @return {string} - SVG path text
   */
  function path(d) {
    return _line(_dimensions.map(function (p) {
      return [position(p), _y[p](d[p])];
    }));
  }

  /**
   * Get the x axis position for some dimenstion and initialize dragging
   * @param {string} d - The dimension name
   * @return {float} - The distance to the right of the origin
   */
  function position(d) {
    var v = _dragging[d];
    return v ? v : _x(d);
  }

  /**
   * Map a list of objects where each object is an attribute with line values to
   *     a list of objects where each object is a line with its attributes listed
   * @param {list} data - A list of objects
   *      eg {
   *        name: Area,
   *        data: [14234, 34132],
   *        scale : d3.scale.linear()
   *      }
   *
   * @return {list} - A list of line objects
   *      eg {
   *        Area: 14234
   *        Bird species: 67
   *        Distance to Mainland: 14165.85749
   *        Land within 500m: 2.60546
   *      }
   */
  function dataToLines(data) {
    var result = [];
    data[0].data.forEach(function (d, i) {
      result[i] = {};
    });
    data.forEach(function (dim) {
      result.forEach(function (line, i) {
        line[dim.name] = dim.data[i];
      });
    });
    return result;
  }

  /**
   * Change foreground line color
   * @param {string} dimension - The name of the dimension to change
   * @returns {void}
   */
  function changeColor(dimension) {
    _svg.selectAll('.dimension').style('font-weight', 'normal').classed('z-scored', false).filter(function (d) {
      return d === dimension;
    }).style('font-weight', 'bold').classed('z-scored', true);
    var z = zScore(_lineData.map(function (i) {
      return parseFloat(i[dimension]);
    }));

    // lines
    _svg.select('.foreground').selectAll('path').style('stroke', function (d) {
      return _color(z(d[dimension]));
    });
  }

  /**
   * color by zScore
   * @param {list} col - A list of values to generate a z-score function from
   * @return {object} - A function that takes a value and returns it's z-score in relation to the values in col
   */
  function zScore(col) {
    var mean = d3.mean(col);
    var sigma = d3.deviation(col);
    return function (d) {
      // Return zScore if std_dev is not 0, else 0
      return sigma ? (d - mean) / sigma : 0;
    };
  }

  /**
   * Provide a consisten transition length
   * @param {object} g - An d3 selection that can be transitioned
   * @return {object} - A d3 transition object
   */
  function transition(g) {
    return g.transition().duration(500);
  }

  /**
   * A brushstart callback control
   * @returns {void}
   */
  function brushstart() {
    d3.event.sourceEvent.stopPropagation();
  }

  /**
   * Handles a brush event, toggling the display of foreground lines.
   * @returns {void}
   */
  function brush() {
    var actives = _dimensions.filter(function (p) {
      return !_y[p].brush.empty();
    });
    var extents = actives.map(function (p) {
      return _y[p].brush.extent();
    });
    _foreground.style('display', function (d) {
      return actives.every(function (p, i) {
        var x = Math.round(d[p] * 100) / 100;
        return Math.round(extents[i][0] * 100) / 100 <= x && x <= Math.round(extents[i][1] * 100) / 100;
      }) ? null : 'none';
    });
  }

  _chart.render = function () {
    this.call();
    return _chart;
  };
  _chart.redraw = function () {
    //  Fade out and remove lines
    transition(_background).style('opacity', 0).transition().remove();
    transition(_foreground).style('opacity', 0).transition().remove();

    // Adjust axes domains
    _data.forEach(function (d) {
      var extent = d3.extent(d.data);
      if (extent[0] === extent[1]) {
        extent[0] -= extent[0] / 2;
        extent[1] += extent[1] / 2;
      }
      _y[d.name].domain(extent);
    });

    // Transition axes
    _svg.selectAll('.axis').each(function (d) {
      transition(d3.select(this)).delay(500).call(_axis.scale(_y[d]));
    });

    // Rebind data
    _background = _svg.select('.background').selectAll('path').data(_lineData);
    _foreground = _svg.select('.foreground').selectAll('path').data(_lineData);
    // Update
    _background.style('opacity', 0).attr('d', path);
    _foreground.style('opacity', 0).attr('d', path);

    // Enter
    _background.enter().append('path').style('opacity', 0).attr('d', path);
    _foreground.enter().append('path').style('opacity', 0).attr('d', path);

    // Update color
    changeColor(d3.select('.z-scored').data()[0]);

    // Fade in lines
    transition(_background).delay(1000).style('opacity', 0.5);
    transition(_foreground).delay(1000).style('opacity', 0.5);

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
    _lineData = dataToLines(_data);
    return _chart;
  };

  return _chart;
};


},{}],3:[function(require,module,exports){
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


},{}]},{},[1])(1)
});