(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
  parallelCoordinates: require('./src/js/parallel_coordinates'),
  scatterplot: require('./src/js/scatterplot')
};

},{"./src/js/parallel_coordinates":2,"./src/js/scatterplot":3}],2:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9wYXJhbGxlbF9jb29yZGluYXRlcy5qcyIsInNyYy9qcy9zY2F0dGVycGxvdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLHFCQUFtQixFQUFFLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQztBQUM3RCxhQUFXLEVBQUUsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0NBQzdDLENBQUM7OztBQ0hGLFlBQVk7Ozs7Ozs7Ozs7O0FBQUM7QUFXYixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVMsTUFBTSxFQUFFO0FBQ2hDLE1BQUksTUFBTSxDQUFDO0FBQ1gsTUFBSSxPQUFPLENBQUM7QUFDWixNQUFJLE9BQU8sQ0FBQztBQUNaLE1BQUksSUFBSSxDQUFDO0FBQ1QsTUFBSSxFQUFFLENBQUM7QUFDUCxNQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDWixNQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDbkIsTUFBSSxXQUFXLENBQUM7QUFDaEIsTUFBSSxXQUFXLENBQUM7QUFDaEIsTUFBSSxXQUFXLENBQUM7QUFDaEIsTUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUMxQixNQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6QyxNQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUMzQixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDMUIsS0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FD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QUNsQixJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVMsQ0FBQyxFQUFFO0FBQUUsYUFBTyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRSxDQUFDLENBQUM7O0FBRXJFLFNBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQ3BCLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FDdEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFTLENBQUMsRUFBRTtBQUFFLGFBQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUUsQ0FBQyxDQUNwRCxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVMsQ0FBQyxFQUFFO0FBQUUsYUFBTyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRSxDQUFDOzs7QUFBQyxBQUcxRCxRQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUM1QixJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUUzQixLQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUNiLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBUyxDQUFDLEVBQUU7QUFBRSxhQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUFFLENBQUMsQ0FDckQsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLENBQUMsRUFBRTtBQUFFLGFBQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUUsQ0FBQyxDQUNyRCxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUNsQixJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVMsQ0FBQyxFQUFFO0FBQUUsYUFBTyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRSxDQUFDLENBQUM7O0FBRXJFLEtBQUMsQ0FBQyxNQUFN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IiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBwYXJhbGxlbENvb3JkaW5hdGVzOiByZXF1aXJlKCcuL3NyYy9qcy9wYXJhbGxlbF9jb29yZGluYXRlcycpLFxuICBzY2F0dGVycGxvdDogcmVxdWlyZSgnLi9zcmMvanMvc2NhdHRlcnBsb3QnKSxcbn07XG4iLCIndXNlIHN0cmljdCc7XG4vKiBnbG9iYWwgZDMgKi9cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIEEgcmV1c2FibGUgZDMgcGFyYWxsZWwgY29vcmRpbmF0ZXMgZ2VuZXJhdG9yIHdpdGggc3RhdGlzdGljYWwgY29sb3JpbmdcbiAqIEBuYW1lIHBhcmFsbGVsQ29vcmRpbmF0ZXNcbiAqIEBhdXRob3IgVGF5bG9yIERlbm91ZGVuXG4gKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50IHwge0RPTSBlbGVtZW50fSBwYXJlbnQgLSBBIGRvbSBlbGVtZW50IHRvIGFwcGVuZCB0aGUgdmlzIHRvXG4gKiBAcmV0dXJuIHtvYmplY3R9IHBhcmFsbGVsQ29vcmRpbmF0ZXNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgdmFyIF93aWR0aDtcbiAgdmFyIF9oZWlnaHQ7XG4gIHZhciBfbWFyZ2luO1xuICB2YXIgX3N2ZztcbiAgdmFyIF94O1xuICB2YXIgX3kgPSB7fTtcbiAgdmFyIF9kcmFnZ2luZyA9IHt9O1xuICB2YXIgX2JhY2tncm91bmQ7XG4gIHZhciBfZm9yZWdyb3VuZDtcbiAgdmFyIF9kaW1lbnNpb25zO1xuICB2YXIgX2xpbmUgPSBkMy5zdmcubGluZSgpO1xuICB2YXIgX2F4aXMgPSBkMy5zdmcuYXhpcygpLm9yaWVudCgnbGVmdCcpO1xuICB2YXIgX2NvbG9yID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKFstMiwgLTAuNSwgMC41LCAyXSlcbiAgICAucmFuZ2UoWycjZjQ2ZDQzJywgJyM3NGFkZDEnLCAnIzc0YWRkMScsICcjNjZiZDYzJ10pXG4gICAgLmludGVycG9sYXRlKGQzLmludGVycG9sYXRlTGFiKTtcbiAgdmFyIF9kYXRhO1xuICB2YXIgX2xpbmVEYXRhO1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSB0aGUgY2hhcnQgdXNpbmcgcHJpdmF0ZSB2YXJpYWJsZXMgb24gY2FsbCB0byBjaGFydC5yZW5kZXIoKVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIGZ1bmN0aW9uIF9jaGFydCgpIHtcbiAgICBfc3ZnID0gZDMuc2VsZWN0KHBhcmVudCkuYXBwZW5kKCdzdmcnKVxuICAgICAgICAuYXR0cignd2lkdGgnLCBfd2lkdGggKyBfbWFyZ2luLmxlZnQgKyBfbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cignaGVpZ2h0JywgX2hlaWdodCArIF9tYXJnaW4udG9wICsgX21hcmdpbi5ib3R0b20pXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIF9tYXJnaW4ubGVmdCArICcsJyArIF9tYXJnaW4udG9wICsgJyknKTtcblxuICAgIC8vIENyZWF0ZSBhIHNjYWxlIGZvciBlYWNoIGRpbWVuc2lvblxuICAgIF9kYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgX3lbZC5uYW1lXSA9IChkLnNjYWxlIHx8IGQzLnNjYWxlLmxpbmVhcigpKVxuICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KGQuZGF0YSkpXG4gICAgICAgICAgLnJhbmdlKFtfaGVpZ2h0LCAwXSk7XG4gICAgfSk7XG5cbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIF9kaW1lbnNpb25zXG4gICAgX2RpbWVuc2lvbnMgPSBfZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lOyB9KTtcbiAgICBfeCA9IGQzLnNjYWxlLm9yZGluYWwoKVxuICAgICAgICAuZG9tYWluKF9kaW1lbnNpb25zKVxuICAgICAgICAucmFuZ2VQb2ludHMoWzAsIF93aWR0aF0sIDEpO1xuXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cbiAgICBfYmFja2dyb3VuZCA9IF9zdmcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhY2tncm91bmQnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKF9saW5lRGF0YSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBBZGQgYmx1ZSBmb3JlZ3JvdW5kIGxpbmVzIGZvciBmb2N1cy5cbiAgICBfZm9yZWdyb3VuZCA9IF9zdmcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2ZvcmVncm91bmQnKVxuICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKF9saW5lRGF0YSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBBZGQgYSBncm91cCBlbGVtZW50IGZvciBlYWNoIGRpbWVuc2lvbi5cbiAgICB2YXIgZyA9IF9zdmcuc2VsZWN0QWxsKCcuZGltZW5zaW9uJylcbiAgICAgICAgLmRhdGEoX2RpbWVuc2lvbnMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnZGltZW5zaW9uJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICd0cmFuc2xhdGUoJyArIF94KGQpICsgJyknOyB9KVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiBfeChkKX07IH0pXG4gICAgICAgICAgLm9uKCdkcmFnc3RhcnQnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBfZHJhZ2dpbmdbZF0gPSBfeChkKTtcbiAgICAgICAgICAgIF9iYWNrZ3JvdW5kLmF0dHIoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBfZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbihfd2lkdGgsIE1hdGgubWF4KDAsIGQzLmV2ZW50LngpKTtcbiAgICAgICAgICAgIF9mb3JlZ3JvdW5kLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICAgICAgICAgIF9kaW1lbnNpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gcG9zaXRpb24oYSkgLSBwb3NpdGlvbihiKTsgfSk7XG4gICAgICAgICAgICBfeC5kb21haW4oX2RpbWVuc2lvbnMpO1xuICAgICAgICAgICAgZy5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihiKSB7IHJldHVybiAndHJhbnNsYXRlKCcgKyBwb3NpdGlvbihiKSArICcpJzsgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ2RyYWdlbmQnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkZWxldGUgX2RyYWdnaW5nW2RdO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihkMy5zZWxlY3QodGhpcykpLmF0dHIoJ3RyYW5zZm9ybScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndHJhbnNsYXRlKCcgKyBfeChkKSArICcpJyk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uKF9mb3JlZ3JvdW5kKS5hdHRyKCdkJywgcGF0aCk7XG4gICAgICAgICAgICBfYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDApXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3Zpc2liaWxpdHknLCBudWxsKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYXhpcycpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHsgZDMuc2VsZWN0KHRoaXMpLmNhbGwoX2F4aXMuc2NhbGUoX3lbZF0pKTsgfSlcbiAgICAgICAgLm9uKCdjbGljaycsIGNoYW5nZUNvbG9yKVxuICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC5zdHlsZSgndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgICAgLmF0dHIoJ3knLCAtOSlcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSk7XG5cbiAgICAvLyBBZGQgYW5kIHN0b3JlIGEgYnJ1c2ggZm9yIGVhY2ggYXhpcy5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdicnVzaCcpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuY2FsbChcbiAgICAgICAgICAgIF95W2RdLmJydXNoID0gZDMuc3ZnLmJydXNoKClcbiAgICAgICAgICAgICAgICAueShfeVtkXSlcbiAgICAgICAgICAgICAgICAub24oJ2JydXNoc3RhcnQnLCBicnVzaHN0YXJ0KVxuICAgICAgICAgICAgICAgIC5vbignYnJ1c2gnLCBicnVzaClcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgLnNlbGVjdEFsbCgncmVjdCcpXG4gICAgICAgIC5hdHRyKCd4JywgLTgpXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIDE2KTtcblxuICAgIC8vIENvbG9yIF9kaW1lbnNpb25zIGJ5IHotc2NvcmVcbiAgICBjaGFuZ2VDb2xvcihfZGltZW5zaW9uc1swXSk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgdGhlIGxpbmUgcGF0aCBmb3IgYSBkYXR1bS5cbiAgICogQHBhcmFtIHtvYmplY3R9IGQgLSBBbiBvYmplY3Qgd2l0aCBheGlzIGF0dHJpYnV0ZXNcbiAgICogQHJldHVybiB7c3RyaW5nfSAtIFNWRyBwYXRoIHRleHRcbiAgICovXG4gIGZ1bmN0aW9uIHBhdGgoZCkge1xuICAgIHJldHVybiBfbGluZShfZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkge1xuICAgICAgcmV0dXJuIFtwb3NpdGlvbihwKSwgX3lbcF0oZFtwXSldO1xuICAgIH0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHggYXhpcyBwb3NpdGlvbiBmb3Igc29tZSBkaW1lbnN0aW9uIGFuZCBpbml0aWFsaXplIGRyYWdnaW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkIC0gVGhlIGRpbWVuc2lvbiBuYW1lXG4gICAqIEByZXR1cm4ge2Zsb2F0fSAtIFRoZSBkaXN0YW5jZSB0byB0aGUgcmlnaHQgb2YgdGhlIG9yaWdpblxuICAgKi9cbiAgZnVuY3Rpb24gcG9zaXRpb24oZCkge1xuICAgIHZhciB2ID0gX2RyYWdnaW5nW2RdO1xuICAgIHJldHVybiB2ID8gdiA6IF94KGQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBhIGxpc3Qgb2Ygb2JqZWN0cyB3aGVyZSBlYWNoIG9iamVjdCBpcyBhbiBhdHRyaWJ1dGUgd2l0aCBsaW5lIHZhbHVlcyB0b1xuICAgKiAgICAgYSBsaXN0IG9mIG9iamVjdHMgd2hlcmUgZWFjaCBvYmplY3QgaXMgYSBsaW5lIHdpdGggaXRzIGF0dHJpYnV0ZXMgbGlzdGVkXG4gICAqIEBwYXJhbSB7bGlzdH0gZGF0YSAtIEEgbGlzdCBvZiBvYmplY3RzXG4gICAqICAgICAgZWcge1xuICAgKiAgICAgICAgbmFtZTogQXJlYSxcbiAgICogICAgICAgIGRhdGE6IFsxNDIzNCwgMzQxMzJdLFxuICAgKiAgICAgICAgc2NhbGUgOiBkMy5zY2FsZS5saW5lYXIoKVxuICAgKiAgICAgIH1cbiAgICpcbiAgICogQHJldHVybiB7bGlzdH0gLSBBIGxpc3Qgb2YgbGluZSBvYmplY3RzXG4gICAqICAgICAgZWcge1xuICAgKiAgICAgICAgQXJlYTogMTQyMzRcbiAgICogICAgICAgIEJpcmQgc3BlY2llczogNjdcbiAgICogICAgICAgIERpc3RhbmNlIHRvIE1haW5sYW5kOiAxNDE2NS44NTc0OVxuICAgKiAgICAgICAgTGFuZCB3aXRoaW4gNTAwbTogMi42MDU0NlxuICAgKiAgICAgIH1cbiAgICovXG4gIGZ1bmN0aW9uIGRhdGFUb0xpbmVzKGRhdGEpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZGF0YVswXS5kYXRhLmZvckVhY2goZnVuY3Rpb24oZCwgaSkgeyByZXN1bHRbaV0gPSB7fTsgfSk7XG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGRpbSkge1xuICAgICAgcmVzdWx0LmZvckVhY2goZnVuY3Rpb24obGluZSwgaSkge1xuICAgICAgICBsaW5lW2RpbS5uYW1lXSA9IGRpbS5kYXRhW2ldO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgZm9yZWdyb3VuZCBsaW5lIGNvbG9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaW1lbnNpb24gLSBUaGUgbmFtZSBvZiB0aGUgZGltZW5zaW9uIHRvIGNoYW5nZVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIGZ1bmN0aW9uIGNoYW5nZUNvbG9yKGRpbWVuc2lvbikge1xuICAgIF9zdmcuc2VsZWN0QWxsKCcuZGltZW5zaW9uJylcbiAgICAgICAgLnN0eWxlKCdmb250LXdlaWdodCcsICdub3JtYWwnKVxuICAgICAgICAuY2xhc3NlZCgnei1zY29yZWQnLCBmYWxzZSlcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZCA9PT0gZGltZW5zaW9uOyB9KVxuICAgICAgICAuc3R5bGUoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKVxuICAgICAgICAuY2xhc3NlZCgnei1zY29yZWQnLCB0cnVlKTtcbiAgICB2YXIgeiA9IHpTY29yZShfbGluZURhdGEubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KGlbZGltZW5zaW9uXSk7XG4gICAgfSkpO1xuXG4gICAgLy8gbGluZXNcbiAgICBfc3ZnLnNlbGVjdCgnLmZvcmVncm91bmQnKS5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9jb2xvcih6KGRbZGltZW5zaW9uXSkpOyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBjb2xvciBieSB6U2NvcmVcbiAgICogQHBhcmFtIHtsaXN0fSBjb2wgLSBBIGxpc3Qgb2YgdmFsdWVzIHRvIGdlbmVyYXRlIGEgei1zY29yZSBmdW5jdGlvbiBmcm9tXG4gICAqIEByZXR1cm4ge29iamVjdH0gLSBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB2YWx1ZSBhbmQgcmV0dXJucyBpdCdzIHotc2NvcmUgaW4gcmVsYXRpb24gdG8gdGhlIHZhbHVlcyBpbiBjb2xcbiAgICovXG4gIGZ1bmN0aW9uIHpTY29yZShjb2wpIHtcbiAgICB2YXIgbWVhbiA9IGQzLm1lYW4oY29sKTtcbiAgICB2YXIgc2lnbWEgPSBkMy5kZXZpYXRpb24oY29sKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgLy8gUmV0dXJuIHpTY29yZSBpZiBzdGRfZGV2IGlzIG5vdCAwLCBlbHNlIDBcbiAgICAgIHJldHVybiAoc2lnbWEgPyAoZCAtIG1lYW4pIC8gc2lnbWEgOiAwKTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFByb3ZpZGUgYSBjb25zaXN0ZW4gdHJhbnNpdGlvbiBsZW5ndGhcbiAgICogQHBhcmFtIHtvYmplY3R9IGcgLSBBbiBkMyBzZWxlY3Rpb24gdGhhdCBjYW4gYmUgdHJhbnNpdGlvbmVkXG4gICAqIEByZXR1cm4ge29iamVjdH0gLSBBIGQzIHRyYW5zaXRpb24gb2JqZWN0XG4gICAqL1xuICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGJydXNoc3RhcnQgY2FsbGJhY2sgY29udHJvbFxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XG4gICAgZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIGZ1bmN0aW9uIGJydXNoKCkge1xuICAgIHZhciBhY3RpdmVzID0gX2RpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICFfeVtwXS5icnVzaC5lbXB0eSgpOyB9KTtcbiAgICB2YXIgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIF95W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcbiAgICBfZm9yZWdyb3VuZC5zdHlsZSgnZGlzcGxheScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcbiAgICAgICAgdmFyIHggPSBNYXRoLnJvdW5kKGRbcF0gKiAxMDApIC8gMTAwO1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChleHRlbnRzW2ldWzBdICogMTAwKSAvIDEwMCA8PSB4ICYmIHggPD0gTWF0aC5yb3VuZChleHRlbnRzW2ldWzFdICogMTAwKSAvIDEwMDtcbiAgICAgIH0pID8gbnVsbCA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIF9jaGFydC5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNhbGwoKTtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQucmVkcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gIEZhZGUgb3V0IGFuZCByZW1vdmUgbGluZXNcbiAgICB0cmFuc2l0aW9uKF9iYWNrZ3JvdW5kKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAucmVtb3ZlKCk7XG4gICAgdHJhbnNpdGlvbihfZm9yZWdyb3VuZClcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMClcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgLy8gQWRqdXN0IGF4ZXMgZG9tYWluc1xuICAgIF9kYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIGV4dGVudCA9IGQzLmV4dGVudChkLmRhdGEpO1xuICAgICAgaWYgKGV4dGVudFswXSA9PT0gZXh0ZW50WzFdKSB7XG4gICAgICAgIGV4dGVudFswXSAtPSBleHRlbnRbMF0gLyAyO1xuICAgICAgICBleHRlbnRbMV0gKz0gZXh0ZW50WzFdIC8gMjtcbiAgICAgIH1cbiAgICAgIF95W2QubmFtZV0uZG9tYWluKGV4dGVudCk7XG4gICAgfSk7XG5cbiAgICAvLyBUcmFuc2l0aW9uIGF4ZXNcbiAgICBfc3ZnLnNlbGVjdEFsbCgnLmF4aXMnKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7IHRyYW5zaXRpb24oZDMuc2VsZWN0KHRoaXMpKS5kZWxheSg1MDApLmNhbGwoX2F4aXMuc2NhbGUoX3lbZF0pKTsgfSk7XG5cbiAgICAvLyBSZWJpbmQgZGF0YVxuICAgIF9iYWNrZ3JvdW5kID0gX3N2Zy5zZWxlY3QoJy5iYWNrZ3JvdW5kJylcbiAgICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKF9saW5lRGF0YSk7XG4gICAgX2ZvcmVncm91bmQgPSBfc3ZnLnNlbGVjdCgnLmZvcmVncm91bmQnKVxuICAgICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoX2xpbmVEYXRhKTtcbiAgICAvLyBVcGRhdGVcbiAgICBfYmFja2dyb3VuZFxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpO1xuICAgIF9mb3JlZ3JvdW5kXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDApXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBFbnRlclxuICAgIF9iYWNrZ3JvdW5kLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMClcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICBfZm9yZWdyb3VuZC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDApXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBVcGRhdGUgY29sb3JcbiAgICBjaGFuZ2VDb2xvcihkMy5zZWxlY3QoJy56LXNjb3JlZCcpLmRhdGEoKVswXSk7XG5cbiAgICAvLyBGYWRlIGluIGxpbmVzXG4gICAgdHJhbnNpdGlvbihfYmFja2dyb3VuZCkuZGVsYXkoMTAwMClcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMC41KTtcbiAgICB0cmFuc2l0aW9uKF9mb3JlZ3JvdW5kKS5kZWxheSgxMDAwKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwLjUpO1xuXG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcblxuICBfY2hhcnQud2lkdGggPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF93aWR0aDsgfVxuICAgIF93aWR0aCA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQuaGVpZ2h0ID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfaGVpZ2h0OyB9XG4gICAgX2hlaWdodCA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQubWFyZ2luID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFyZ2luOyB9XG4gICAgX21hcmdpbiA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQuZGF0YSA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2RhdGE7IH1cbiAgICBfZGF0YSA9IHZhbDtcbiAgICBfbGluZURhdGEgPSBkYXRhVG9MaW5lcyhfZGF0YSk7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcblxuICByZXR1cm4gX2NoYXJ0O1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGdsb2JhbCBkMyBzcyAqL1xuLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogQSByZXVzYWJsZSBkMyBzY2F0dGVycGxvdCBnZW5lcmF0b3JcbiAqIEBuYW1lIHNjYXR0ZXJwbG90XG4gKiBAYXV0aG9yIFRheWxvciBEZW5vdWRlblxuICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudCB8IHtET00gZWxlbWVudH0gcGFyZW50IC0gQSBkb20gZWxlbWVudCB0byBhcHBlbmQgdGhlIHZpcyB0b1xuICogQHJldHVybiB7b2JqZWN0fSBzY2F0dGVycGxvdFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICB2YXIgX3dpZHRoO1xuICB2YXIgX2hlaWdodDtcbiAgdmFyIF9tYXJnaW47XG4gIHZhciBfZGF0YTtcbiAgdmFyIF94ID0gZDMuc2NhbGUubGluZWFyKCk7XG4gIHZhciBfeSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICB2YXIgX3hMb2cgPSBmYWxzZTtcbiAgdmFyIF95TG9nID0gZmFsc2U7XG4gIHZhciBfeEF4aXM7XG4gIHZhciBfeUF4aXM7XG4gIHZhciBfeEFjY2Vzc29yO1xuICB2YXIgX3lBY2Nlc3NvcjtcbiAgdmFyIF94TGFiZWw7XG4gIHZhciBfeUxhYmVsO1xuICB2YXIgX2NvbG9yID0gZDMuc2NhbGUuY2F0ZWdvcnkxMCgpO1xuICB2YXIgX2NvbG9yQWNjZXNzb3IgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4gIHZhciBfa2V5QWNjZXNzb3IgPSBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfTtcbiAgdmFyIF9yYWRpdXMgPSA1O1xuICB2YXIgX3JlZ0xpbmU7XG4gIHZhciBfclNxdWFyZWQgPSAxO1xuICB2YXIgX2NvcnJlbGF0aW9uID0gMTtcbiAgdmFyIF9jb3ZhcmlhbmNlID0gMTtcbiAgdmFyIF9zdmc7XG5cbiAgZnVuY3Rpb24gX2NoYXJ0KCkge1xuICAgIC8vIENyZWF0ZSBzdmcgb2JqZWN0XG4gICAgX3N2ZyA9IGQzLnNlbGVjdChwYXJlbnQpLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIF93aWR0aCArIF9tYXJnaW4ubGVmdCArIF9tYXJnaW4ucmlnaHQpXG4gICAgICAuYXR0cignaGVpZ2h0JywgX2hlaWdodCArIF9tYXJnaW4udG9wICsgX21hcmdpbi5ib3R0b20pXG4gICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgX21hcmdpbi5sZWZ0ICsgJywnICsgX21hcmdpbi50b3AgKyAnKScpO1xuXG4gICAgLy8gQ3JlYXRlIGNsZWFuZWQgZGF0YXNldCB0aGF0IGRvZXNuJ3QgaW5jbHVkZSBub24gbnVtZXJpYyBvciBsb2coMCkgdmFsdWVzXG4gICAgdmFyIGNsZWFuRGF0YSA9IF9kYXRhLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gIShpc05hTihfeEFjY2Vzc29yKGQpKSB8fCBpc05hTihfeUFjY2Vzc29yKGQpKSk7XG4gICAgfSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAhKChfeExvZyAmJiBfeEFjY2Vzc29yKGQpID09PSAwKSB8fCAoX3lMb2cgJiYgX3lBY2Nlc3NvcihkKSA9PT0gMCkpO1xuICAgIH0pO1xuXG4gICAgLy8gU2V0IHggYW5kIHkgYXhpcyBiYXNlZCBvbiBzZWxlY3RlZCBhdHRyaWJ1dGVzXG4gICAgX3guZG9tYWluKGQzLmV4dGVudChjbGVhbkRhdGEsIF94QWNjZXNzb3IpKVxuICAgICAgLnJhbmdlKFswLCBfd2lkdGhdKTtcbiAgICBfeS5kb21haW4oZDMuZXh0ZW50KGNsZWFuRGF0YSwgX3lBY2Nlc3NvcikpXG4gICAgICAucmFuZ2UoW19oZWlnaHQsIDBdKTtcblxuICAgIC8vIENyZWF0ZSBzdmcgYXhpcyBnZW5lcmF0b3JzXG4gICAgX3hBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKF94KVxuICAgICAgLm9yaWVudCgnYm90dG9tJylcbiAgICAgIC50aWNrU2l6ZSgtX2hlaWdodCk7XG4gICAgX3lBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKF95KVxuICAgICAgLm9yaWVudCgnbGVmdCcpXG4gICAgICAudGlja1NpemUoLV93aWR0aCk7XG5cbiAgICAvLyBBZGQgYXhlcyB0byBjaGFydFxuICAgIF9zdmcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsICcgKyBfaGVpZ2h0ICsgJyknKVxuICAgICAgICAuY2FsbChfeEF4aXMpO1xuICAgIF9zdmcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3kgYXhpcycpXG4gICAgICAgIC5jYWxsKF95QXhpcyk7XG5cbiAgICAvLyBBZGQgYXhpcyBsYWJlbHNcbiAgICBfc3ZnLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd4IGxhYmVsJylcbiAgICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgIC5hdHRyKCd4JywgX3dpZHRoIC0gMTApXG4gICAgICAgIC5hdHRyKCd5JywgX2hlaWdodCAtIDUpXG4gICAgICAgIC50ZXh0KF94TGFiZWwpO1xuICAgIF9zdmcuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3kgbGFiZWwnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3JvdGF0ZSgtOTApJylcbiAgICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgIC5hdHRyKCd4JywgLTUpXG4gICAgICAgIC5hdHRyKCd5JywgMTApXG4gICAgICAgIC50ZXh0KF95TGFiZWwpO1xuXG4gICAgLy8gQWRkIGZyYW1lIGFyb3VuZCBjaGFydFxuICAgIF9zdmcuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2ZyYW1lJylcbiAgICAgICAgLmF0dHIoJ3dpZHRoJywgX3dpZHRoKVxuICAgICAgICAuYXR0cignaGVpZ2h0JywgX2hlaWdodCk7XG5cbiAgICAvLyBDcmVhdGUgY2xpcCBwYXRoXG4gICAgX3N2Zy5hcHBlbmQoJ2RlZnMnKVxuICAgICAgLmFwcGVuZCgnY2xpcFBhdGgnKVxuICAgICAgICAuYXR0cignaWQnLCAnY2hhcnRDbGlwJylcbiAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAuYXR0cignd2lkdGgnLCBfd2lkdGgpXG4gICAgICAgIC5hdHRyKCdoZWlnaHQnLCBfaGVpZ2h0KTtcblxuICAgIC8vIENhbGN1bGF0ZSBzdGF0aXN0aWNzIGFuZCByZWdyZXNzaW9uIGxpbmVcbiAgICB2YXIgc3RhdHMgPSBjYWxjdWxhdGVTdGF0cyhjbGVhbkRhdGEpO1xuICAgIF9yZWdMaW5lID0gc3RhdHMucmVnTGluZTtcbiAgICBfclNxdWFyZWQgPSBzdGF0cy5yU3F1YXJlZDtcbiAgICBfY29ycmVsYXRpb24gPSBzdGF0cy5jb3JyZWxhdGlvbjtcbiAgICBfY292YXJpYW5jZSA9IHN0YXRzLmNvdmFyaWFuY2U7XG5cbiAgICAvLyBBZGQgcmVncmVzc2lvbiBsaW5lIHRvIENoYXJ0XG4gICAgX3N2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAncmVncmVzc2lvbicpXG4gICAgICAgIC5hdHRyKCdjbGlwLXBhdGgnLCAndXJsKCNjaGFydENsaXApJylcbiAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdibGFjaycpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS1kYXNoYXJyYXknLCAnNSw1LDEwLDUnKVxuICAgICAgICAuYXR0cigneDEnLCBfeChfeC5kb21haW4oKVswXSkpXG4gICAgICAgIC5hdHRyKCd5MScsIF95KGdldFkoX3guZG9tYWluKClbMF0sIF9yZWdMaW5lKSkpXG4gICAgICAgIC5hdHRyKCd4MicsIF94KF94LmRvbWFpbigpWzFdKSlcbiAgICAgICAgLmF0dHIoJ3kyJywgX3koZ2V0WShfeC5kb21haW4oKVsxXSwgX3JlZ0xpbmUpKSk7XG5cbiAgICAvLyBBZGQgZGF0YSBtYXJrcyB0byBjaGFydFxuICAgIHZhciBtYXJrcyA9IF9zdmcuc2VsZWN0QWxsKCdnLm1hcmsnKVxuICAgICAgICAuZGF0YShjbGVhbkRhdGEpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFyaycpO1xuXG4gICAgbWFya3MuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeChfeEFjY2Vzc29yKGQpKTsgfSlcbiAgICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3koX3lBY2Nlc3NvcihkKSk7IH0pXG4gICAgICAgIC5hdHRyKCdyJywgX3JhZGl1cylcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBfY29sb3IoX2NvbG9yQWNjZXNzb3IoZCkpOyB9KTtcblxuICAgIG1hcmtzLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC50ZXh0KF9rZXlBY2Nlc3NvcilcbiAgICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeChfeEFjY2Vzc29yKGQpKTsgfSlcbiAgICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeShfeUFjY2Vzc29yKGQpKTsgfSlcbiAgICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgIC5hdHRyKCdkeScsIC01KVxuICAgICAgICAuYXR0cignZHgnLCAtMik7XG4gIH1cblxuICBfY2hhcnQucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jYWxsKCk7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LnJlZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENyZWF0ZSBjbGVhbmVkIGRhdGFzZXQgdGhhdCBkb2Vzbid0IGluY2x1ZGUgbm9uIG51bWVyaWMgb3IgbG9nKDApIHZhbHVlc1xuICAgIHZhciBjbGVhbkRhdGEgPSBfZGF0YS5maWx0ZXIoZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuICEoaXNOYU4oX3hBY2Nlc3NvcihkKSkgfHwgaXNOYU4oX3lBY2Nlc3NvcihkKSkpO1xuICAgIH0pLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gISgoX3hMb2cgJiYgX3hBY2Nlc3NvcihkKSA9PT0gMCkgfHwgKF95TG9nICYmIF95QWNjZXNzb3IoZCkgPT09IDApKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB4IGFuZCB5IGRvbWFpblxuICAgIF94LmRvbWFpbihkMy5leHRlbnQoY2xlYW5EYXRhLCBfeEFjY2Vzc29yKSlcbiAgICAgIC5yYW5nZShbMCwgX3dpZHRoXSk7XG4gICAgX3kuZG9tYWluKGQzLmV4dGVudChjbGVhbkRhdGEsIF95QWNjZXNzb3IpKVxuICAgICAgLnJhbmdlKFtfaGVpZ2h0LCAwXSk7XG5cbiAgICAvLyBVcGRhdGUgYXhlcyBnZW5lcmF0b3Igc2NhbGVcbiAgICBfeEF4aXMuc2NhbGUoX3gpO1xuICAgIF95QXhpcy5zY2FsZShfeSk7XG5cbiAgICAvLyBEZWZpbmUgY29uc2lzdGVudCB0cmFuc2l0aW9uIGR1cmF0aW9uXG4gICAgdmFyIHQgPSAxNTAwO1xuXG4gICAgLy8gVXBkYXRlIGF4ZXNcbiAgICBfc3ZnLnNlbGVjdCgnLnguYXhpcycpXG4gICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24odClcbiAgICAgICAgLmNhbGwoX3hBeGlzKTtcbiAgICBfc3ZnLnNlbGVjdCgnLnkuYXhpcycpXG4gICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24odClcbiAgICAgICAgLmNhbGwoX3lBeGlzKTtcblxuICAgIC8vIFVwZGF0ZSBheGlzIGxhYmVsc1xuICAgIF9zdmcuc2VsZWN0KCcueC5sYWJlbCcpXG4gICAgICAgIC50ZXh0KF94TGFiZWwpO1xuICAgIF9zdmcuc2VsZWN0KCcueS5sYWJlbCcpXG4gICAgICAgIC50ZXh0KF95TGFiZWwpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIHN0YXRpc3RpY3MgYW5kIHJlZ3Jlc3Npb24gbGluZVxuICAgIHZhciBzdGF0cyA9IGNhbGN1bGF0ZVN0YXRzKGNsZWFuRGF0YSk7XG4gICAgX3JlZ0xpbmUgPSBzdGF0cy5yZWdMaW5lO1xuICAgIF9yU3F1YXJlZCA9IHN0YXRzLnJTcXVhcmVkO1xuICAgIF9jb3JyZWxhdGlvbiA9IHN0YXRzLmNvcnJlbGF0aW9uO1xuICAgIF9jb3ZhcmlhbmNlID0gc3RhdHMuY292YXJpYW5jZTtcblxuICAgIC8vIEFkZCByZWdyZXNzaW9uIGxpbmUgdG8gQ2hhcnRcbiAgICBfc3ZnLnNlbGVjdCgnLnJlZ3Jlc3Npb24gbGluZScpXG4gICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKHQpXG4gICAgICAgIC5hdHRyKCd4MScsIF94KF94LmRvbWFpbigpWzBdKSlcbiAgICAgICAgLmF0dHIoJ3kxJywgX3koZ2V0WShfeC5kb21haW4oKVswXSwgX3JlZ0xpbmUpKSlcbiAgICAgICAgLmF0dHIoJ3gyJywgX3goX3guZG9tYWluKClbMV0pKVxuICAgICAgICAuYXR0cigneTInLCBfeShnZXRZKF94LmRvbWFpbigpWzFdLCBfcmVnTGluZSkpKTtcblxuICAgIC8vIFVwZGF0ZSBkYXRhIGFuZCBtYXJrIHBvc2l0aW9uc1xuICAgIHZhciBtYXJrcyA9IF9zdmcuc2VsZWN0QWxsKCdnLm1hcmsnKVxuICAgICAgICAuZGF0YShjbGVhbkRhdGEsIF9rZXlBY2Nlc3Nvcik7XG5cbiAgICAvLyBVcGRhdGVcbiAgICBtYXJrcy5zZWxlY3RBbGwoJ2NpcmNsZScpXG4gICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKHQpXG4gICAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF94KF94QWNjZXNzb3IoZCkpOyB9KVxuICAgICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeShfeUFjY2Vzc29yKGQpKTsgfSlcbiAgICAgICAgLmF0dHIoJ3InLCBfcmFkaXVzKVxuICAgICAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9jb2xvcihfY29sb3JBY2Nlc3NvcihkKSk7IH0pO1xuXG4gICAgbWFya3Muc2VsZWN0QWxsKCd0ZXh0JylcbiAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24odClcbiAgICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeChfeEFjY2Vzc29yKGQpKTsgfSlcbiAgICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeShfeUFjY2Vzc29yKGQpKTsgfSk7XG5cbiAgICAvLyBFbnRlclxuICAgIHZhciBnID0gbWFya3MuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFyaycpO1xuXG4gICAgZy5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF94KF94QWNjZXNzb3IoZCkpOyB9KVxuICAgICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBfeShfeUFjY2Vzc29yKGQpKTsgfSlcbiAgICAgICAgLmF0dHIoJ3InLCBfcmFkaXVzKVxuICAgICAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIF9jb2xvcihfY29sb3JBY2Nlc3NvcihkKSk7IH0pO1xuXG4gICAgZy5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAudGV4dChfa2V5QWNjZXNzb3IpXG4gICAgICAgIC5hdHRyKCd4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3goX3hBY2Nlc3NvcihkKSk7IH0pXG4gICAgICAgIC5hdHRyKCd5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gX3koX3lBY2Nlc3NvcihkKSk7IH0pXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAuYXR0cignZHknLCAtNSlcbiAgICAgICAgLmF0dHIoJ2R4JywgLTIpO1xuXG4gICAgLy8gRXhpdFxuICAgIG1hcmtzLmV4aXQoKS5yZW1vdmUoKTtcblxuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC53aWR0aCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3dpZHRoOyB9XG4gICAgX3dpZHRoID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5oZWlnaHQgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9oZWlnaHQ7IH1cbiAgICBfaGVpZ2h0ID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5tYXJnaW4gPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9tYXJnaW47IH1cbiAgICBfbWFyZ2luID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5kYXRhID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGF0YTsgfVxuICAgIF9kYXRhID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC54QWNjZXNzb3IgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF94QWNjZXNzb3I7IH1cbiAgICBfeEFjY2Vzc29yID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC55QWNjZXNzb3IgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF95QWNjZXNzb3I7IH1cbiAgICBfeUFjY2Vzc29yID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC54TGFiZWwgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF94TGFiZWw7IH1cbiAgICBfeExhYmVsID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC55TGFiZWwgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF95TGFiZWw7IH1cbiAgICBfeUxhYmVsID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC54TG9nID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfeExvZzsgfVxuICAgIF94TG9nID0gdmFsO1xuICAgIF94ID0gX3hMb2cgPyBkMy5zY2FsZS5sb2coKSA6IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC55TG9nID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfeUxvZzsgfVxuICAgIF95TG9nID0gdmFsO1xuICAgIF95ID0gX3lMb2cgPyBkMy5zY2FsZS5sb2coKSA6IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5jb2xvciA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2NvbG9yOyB9XG4gICAgX2NvbG9yID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5jb2xvckFjY2Vzc29yID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY29sb3JBY2Nlc3NvcjsgfVxuICAgIF9jb2xvckFjY2Vzc29yID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5rZXlBY2Nlc3NvciA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2tleUFjY2Vzc29yOyB9XG4gICAgX2tleUFjY2Vzc29yID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5yYWRpdXMgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9yYWRpdXM7IH1cbiAgICBfcmFkaXVzID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5yU3F1YXJlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfclNxdWFyZWQ7XG4gIH07XG4gIF9jaGFydC5jb3JyZWxhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfY29ycmVsYXRpb247XG4gIH07XG4gIF9jaGFydC5jb3ZhcmlhbmNlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9jb3ZhcmlhbmNlO1xuICB9O1xuXG4gIHJldHVybiBfY2hhcnQ7XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgYmFzZSB0ZW4gbG9nIG9mIGEgTnVtYmVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkIC0gQSBudW1iZXIgdG8gYXBwbHkgdGhlIG9wZXJhdGlvbiBvblxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGxvZyBiYXNlIDEwIG9mIGRcbiAgICovXG4gIGZ1bmN0aW9uIGxvZzEwKGQpIHtcbiAgICByZXR1cm4gTWF0aC5sb2coZCkgLyBNYXRoLmxvZygxMCk7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYW4geCB2YWx1ZSBvZiB1bi10cmFuc2Zvcm1lZCBkYXRhIChubyBsb2cgdHJhbnNmb3JtIGV0Yy4pLFxuICAgKiBnZXQgdGhlIHVudHJhbnNmb3JtZWQgeSBjb29yZGluYXRlIGZyb20gdGhlIHJlZ3Jlc3Npb24gbGluZVxuICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSB1bnRyYW5zZm9ybWVkIHggdmFsdWUgaW4gbGluZWFyIHNwYWNlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlZ0xpbmUgLSBUaGUgcmVncmVzc2lvbiBsaW5lIGNhbGN1bGF0ZWQgdXNpbmdcbiAgICogICAgYSB0cmFuc2Zvcm1lZCBkYXRhc2V0IHRoYXQgYWNjb3VudGVkIGZvciB0aGUgbG9nIHNjYWxlc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHkgLSBUaGUgdW50cmFuc2Zvcm1lZCB5IHZhbHVlIGluIGxpbmVhciBzcGFjZSB0byBwbG90IG9uIHRoZSBjaGFydFxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0WSh4LCByZWdMaW5lKSB7XG4gICAgdmFyIHkgPSByZWdMaW5lKF94TG9nID8gbG9nMTAoeCkgOiB4KTtcbiAgICByZXR1cm4gX3lMb2cgPyBNYXRoLnBvdygxMCwgeSkgOiB5O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBhbGwgY2hhcnQgc3RhdGlzdGljYWwgdmFsdWVzIGFuZCByZWdyZXNzbGlvbiBsaW5lYXJSZWdyZXNzaW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0W119IGRhdGEgLSBUaGUgZGF0YXNldCB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgc3RhdGlzdGljc1xuICAgKiBAcmV0dXJuIHtPYmplY3R9IHN0YXRzIC0gQW4gb2JqZWN0IHdpdGggYWxsIGNhbGN1bGF0ZWQgc3RhdGlzdGljc1xuICAgKi9cbiAgZnVuY3Rpb24gY2FsY3VsYXRlU3RhdHMoZGF0YSkge1xuICAgIC8vIEdldCByZWdyZXNzaW9uIGxpbmUgZm9ybXVsYVxuICAgIHZhciBzc0RhdGEgPSBkYXRhLm1hcChmdW5jdGlvbihkKSB7XG4gICAgICB2YXIgeEQgPSBfeExvZyA/IGxvZzEwKF94QWNjZXNzb3IoZCkpIDogX3hBY2Nlc3NvcihkKTtcbiAgICAgIHZhciB5RCA9IF95TG9nID8gbG9nMTAoX3lBY2Nlc3NvcihkKSkgOiBfeUFjY2Vzc29yKGQpO1xuICAgICAgcmV0dXJuIFt4RCwgeURdO1xuICAgIH0pO1xuICAgIHZhciBtYiA9IHNzLmxpbmVhclJlZ3Jlc3Npb24oc3NEYXRhKTtcbiAgICB2YXIgcmVnTGluZSA9IHNzLmxpbmVhclJlZ3Jlc3Npb25MaW5lKG1iKTtcblxuICAgIC8vIENhbGN1bGF0ZWQgc3RhdGlzdGljc1xuICAgIHZhciByU3F1YXJlZCA9IHNzLnJTcXVhcmVkKHNzRGF0YSwgcmVnTGluZSk7XG4gICAgdmFyIGNvcnJlbGF0aW9uID0gc3Muc2FtcGxlQ29ycmVsYXRpb24oXG4gICAgICBzc0RhdGEubWFwKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZFswXTsgfSksXG4gICAgICBzc0RhdGEubWFwKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZFsxXTsgfSlcbiAgICApO1xuICAgIHZhciBjb3ZhcmlhbmNlID0gc3Muc2FtcGxlQ292YXJpYW5jZShcbiAgICAgIHNzRGF0YS5tYXAoZnVuY3Rpb24oZCkge3JldHVybiBkWzBdOyB9KSxcbiAgICAgIHNzRGF0YS5tYXAoZnVuY3Rpb24oZCkge3JldHVybiBkWzFdOyB9KVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVnOiBtYixcbiAgICAgIHJlZ0xpbmU6IHJlZ0xpbmUsXG4gICAgICByU3F1YXJlZDogclNxdWFyZWQsXG4gICAgICBjb3JyZWxhdGlvbjogY29ycmVsYXRpb24sXG4gICAgICBjb3ZhcmlhbmNlOiBjb3ZhcmlhbmNlXG4gICAgfTtcbiAgfVxufTtcbiJdfQ==
