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
module.exports = function parallelCoordinates(parent) {
  var _y = {};
  var _dragging = {};
  var _line = d3.svg.line();
  var _axis = d3.svg.axis().orient('left');
  var _color = d3.scale.linear().domain([-2, -0.5, 0.5, 2]).range(['#f46d43', '#74add1', '#74add1', '#66bd63']).interpolate(d3.interpolateLab);

  var _width = undefined;
  var _height = undefined;
  var _margin = undefined;
  var _svg = undefined;
  var _x = undefined;
  var _background = undefined;
  var _foreground = undefined;
  var _dimensions = undefined;
  var _data = undefined;
  var _lineData = undefined;

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
      return result[i] = {};
    });
    data.forEach(function forEachDim(dim) {
      result.forEach(function addDimData(line, i) {
        result[i][dim.name] = dim.data[i];
      });
    });
    return result;
  }

  /**
   * color by zScore
   * @param {list} col - A list of values to generate a z-score function from
   * @return {object} - Function that returns z-score relative to values in col
   */
  function zScore(col) {
    var mean = d3.mean(col);
    var sigma = d3.deviation(col);
    // Return zScore if std_dev is not 0, else 0
    return function (d) {
      return sigma ? (d - mean) / sigma : 0;
    };
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
    _foreground.style('display', function toggleDisplay(d) {
      return actives.every(function brushed(p, i) {
        var x = Math.round(d[p] * 100) / 100;
        return Math.round(extents[i][0] * 100) / 100 <= x && x <= Math.round(extents[i][1] * 100) / 100;
      }) ? null : 'none';
    });
  }

  /**
   * Generate the chart using private variables on call to chart.render()
   * @returns {void}
   */
  function _chart() {
    _svg = d3.select(parent).append('svg').attr('width', _width + _margin.left + _margin.right).attr('height', _height + _margin.top + _margin.bottom).append('g').attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

    // Create a scale for each dimension
    _data.forEach(function initScale(d) {
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
    }).on('dragstart', function onDragStart(d) {
      _dragging[d] = _x(d);
      _background.attr('visibility', 'hidden');
    }).on('drag', function onDrag(d) {
      _dragging[d] = Math.min(_width, Math.max(0, d3.event.x));
      _foreground.attr('d', path);
      _dimensions.sort(function (a, b) {
        return position(a) - position(b);
      });
      _x.domain(_dimensions);
      g.attr('transform', function (b) {
        return 'translate(' + position(b) + ')';
      });
    }).on('dragend', function onDragEnd(d) {
      delete _dragging[d];
      transition(d3.select(this)).attr('transform', 'translate(' + _x(d) + ')');
      transition(_foreground).attr('d', path);
      _background.attr('d', path).transition().delay(500).duration(0).attr('visibility', null);
    }));

    // Add an axis and title.
    g.append('g').attr('class', 'axis').each(function callAxis(d) {
      d3.select(this).call(_axis.scale(_y[d]));
    }).on('click', changeColor).append('text').style('text-anchor', 'middle').attr('y', -9).text(function (d) {
      return d;
    });

    // Add and store a brush for each axis.
    g.append('g').attr('class', 'brush').each(function storeBrush(d) {
      d3.select(this).call(_y[d].brush = d3.svg.brush().y(_y[d]).on('brushstart', brushstart).on('brush', brush));
    }).selectAll('rect').attr('x', -8).attr('width', 16);

    // Color _dimensions by z-score
    changeColor(_dimensions[0]);
  }

  _chart.render = function render() {
    this.call();
    return _chart;
  };
  _chart.redraw = function redraw() {
    //  Fade out and remove lines
    transition(_background).style('opacity', 0).transition().remove();
    transition(_foreground).style('opacity', 0).transition().remove();

    // Adjust axes domains
    _data.forEach(function adjustAxisDomain(d) {
      var extent = d3.extent(d.data);
      if (extent[0] === extent[1]) {
        extent[0] -= extent[0] / 2;
        extent[1] += extent[1] / 2;
      }
      _y[d.name].domain(extent);
    });

    // Transition axes
    _svg.selectAll('.axis').each(function transitionAxis(d) {
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

  _chart.width = function width(val) {
    if (!arguments.length) {
      return _width;
    }
    _width = val;
    return _chart;
  };
  _chart.height = function height(val) {
    if (!arguments.length) {
      return _height;
    }
    _height = val;
    return _chart;
  };
  _chart.margin = function margin(val) {
    if (!arguments.length) {
      return _margin;
    }
    _margin = val;
    return _chart;
  };
  _chart.data = function data(val) {
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
module.exports = function scatterplot(parent) {
  var _width = undefined;
  var _height = undefined;
  var _margin = undefined;
  var _data = undefined;
  var _x = d3.scale.linear();
  var _y = d3.scale.linear();
  var _xLog = false;
  var _yLog = false;
  var _xAxis = undefined;
  var _yAxis = undefined;
  var _xAccessor = undefined;
  var _yAccessor = undefined;
  var _xLabel = undefined;
  var _yLabel = undefined;
  var _color = d3.scale.category10();
  var _colorAccessor = function _colorAccessor() {
    return 0;
  };
  var _keyAccessor = function _keyAccessor(d) {
    return d.key;
  };
  var _radius = 5;
  var _regLine = undefined;
  var _rSquared = 1;
  var _correlation = 1;
  var _covariance = 1;
  var _svg = undefined;

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
    var ssData = data.map(function ssData(d) {
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

  _chart.render = function render() {
    this.call();
    return _chart;
  };
  _chart.redraw = function redraw() {
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
  _chart.width = function width(val) {
    if (!arguments.length) {
      return _width;
    }
    _width = val;
    return _chart;
  };
  _chart.height = function height(val) {
    if (!arguments.length) {
      return _height;
    }
    _height = val;
    return _chart;
  };
  _chart.margin = function margin(val) {
    if (!arguments.length) {
      return _margin;
    }
    _margin = val;
    return _chart;
  };
  _chart.data = function data(val) {
    if (!arguments.length) {
      return _data;
    }
    _data = val;
    return _chart;
  };
  _chart.xAccessor = function xAccessor(val) {
    if (!arguments.length) {
      return _xAccessor;
    }
    _xAccessor = val;
    return _chart;
  };
  _chart.yAccessor = function yAccessor(val) {
    if (!arguments.length) {
      return _yAccessor;
    }
    _yAccessor = val;
    return _chart;
  };
  _chart.xLabel = function xLabel(val) {
    if (!arguments.length) {
      return _xLabel;
    }
    _xLabel = val;
    return _chart;
  };
  _chart.yLabel = function yLabel(val) {
    if (!arguments.length) {
      return _yLabel;
    }
    _yLabel = val;
    return _chart;
  };
  _chart.xLog = function xLog(val) {
    if (!arguments.length) {
      return _xLog;
    }
    _xLog = val;
    _x = _xLog ? d3.scale.log() : d3.scale.linear();
    return _chart;
  };
  _chart.yLog = function yLog(val) {
    if (!arguments.length) {
      return _yLog;
    }
    _yLog = val;
    _y = _yLog ? d3.scale.log() : d3.scale.linear();
    return _chart;
  };
  _chart.color = function color(val) {
    if (!arguments.length) {
      return _color;
    }
    _color = val;
    return _chart;
  };
  _chart.colorAccessor = function colorAccessor(val) {
    if (!arguments.length) {
      return _colorAccessor;
    }
    _colorAccessor = val;
    return _chart;
  };
  _chart.keyAccessor = function keyAccessor(val) {
    if (!arguments.length) {
      return _keyAccessor;
    }
    _keyAccessor = val;
    return _chart;
  };
  _chart.radius = function radius(val) {
    if (!arguments.length) {
      return _radius;
    }
    _radius = val;
    return _chart;
  };
  _chart.rSquared = function rSquared() {
    return _rSquared;
  };
  _chart.correlation = function correlation() {
    return _correlation;
  };
  _chart.covariance = function covariance() {
    return _covariance;
  };

  return _chart;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9wYXJhbGxlbF9jb29yZGluYXRlcy5qcyIsInNyYy9qcy9zY2F0dGVycGxvdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLHFCQUFtQixFQUFFLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQztBQUM3RCxhQUFXLEVBQUUsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0NBQzdDLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQ09GLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUU7QUFDcEQsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQ2QsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FDM0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQzFCLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQ25ELFdBQVcsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUM7O0FBRXBDLE1BQUksTUFBTSxZQUFBLENBQUM7QUFDWCxNQUFJLE9BQU8sWUFBQSxDQUFDO0FBQ1osTUFBSSxPQUFPLFlBQUEsQ0FBQztBQUNaLE1BQUksSUFBSSxZQUFBLENBQUM7QUFDVCxNQUFJLEVBQUUsWUFBQSxDQUFD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QUFDO0tBQUU7QUFDekMsVUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNiLFdBQU8sTUFBTSxDQUFDO0dBQ2YsQ0FBQztBQUNGLFFBQU0sQ0FBQyxhQUFhLEdBQUcsU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFFO0FBQ2pELFFBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQUUsYUFBTyxjQUFjLENBQUM7S0FBRTtBQUNqRCxrQkFBYyxHQUFHLEdBQUcsQ0FBQztBQUNyQixXQUFPLE1BQU0sQ0FBQztHQUNmLENBQUM7QUFDRixRQUFNLENBQUMsV0FBVyxHQUFHLFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRTtBQUM3QyxRQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtBQUFFLGFBQU8sWUFBWSxDQUFDO0tBQUU7QUFDL0MsZ0JBQVksR0FBRyxHQUFHLENBQUM7QUFDbkIsV0FBTyxNQUFNLENBQUM7R0FDZixDQUFDO0FBQ0YsUUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUU7QUFDbkMsUUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFBRSxhQUFPLE9BQU8sQ0FBQztLQUFFO0FBQzFDLFdBQU8sR0FBRyxHQUFHLENBQUM7QUFDZCxXQUFPLE1BQU0sQ0FBQztHQUNmLENBQUM7QUFDRixRQUFNLENBQUMsUUFBUSxHQUFHLFNBQVMsUUFBUSxHQUFHO0FBQ3BDLFdBQU8sU0FBUyxDQUFDO0dBQ2xCLENBQUM7QUFDRixRQUFNLENBQUMsV0FBVyxHQUFHLFNBQVMsV0FBVyxHQUFHO0FBQzFDLFdBQU8sWUFBWSxDQUFDO0dBQ3JCLENBQUM7QUFDRixRQUFNLENBQUMsVUFBVSxHQUFHLFNBQVMsVUFBVSxHQUFHO0FBQ3hDLFdBQU8sV0FBVyxDQUFDO0dBQ3BCLENBQUM7O0FBRUYsU0FBTyxNQUFNLENBQUM7Q0FDZixDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBwYXJhbGxlbENvb3JkaW5hdGVzOiByZXF1aXJlKCcuL3NyYy9qcy9wYXJhbGxlbF9jb29yZGluYXRlcycpLFxuICBzY2F0dGVycGxvdDogcmVxdWlyZSgnLi9zcmMvanMvc2NhdHRlcnBsb3QnKSxcbn07XG4iLCIvKiBnbG9iYWwgZDMgKi9cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIEEgcmV1c2FibGUgZDMgcGFyYWxsZWwgY29vcmRpbmF0ZXMgZ2VuZXJhdG9yIHdpdGggc3RhdGlzdGljYWwgY29sb3JpbmdcbiAqIEBuYW1lIHBhcmFsbGVsQ29vcmRpbmF0ZXNcbiAqIEBhdXRob3IgVGF5bG9yIERlbm91ZGVuXG4gKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50IHwge0RPTSBlbGVtZW50fSBwYXJlbnQgLSBBIGRvbSBlbGVtZW50IHRvIGFwcGVuZCB0aGUgdmlzIHRvXG4gKiBAcmV0dXJuIHtvYmplY3R9IHBhcmFsbGVsQ29vcmRpbmF0ZXNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJhbGxlbENvb3JkaW5hdGVzKHBhcmVudCkge1xuICBjb25zdCBfeSA9IHt9O1xuICBjb25zdCBfZHJhZ2dpbmcgPSB7fTtcbiAgY29uc3QgX2xpbmUgPSBkMy5zdmcubGluZSgpO1xuICBjb25zdCBfYXhpcyA9IGQzLnN2Zy5heGlzKCkub3JpZW50KCdsZWZ0Jyk7XG4gIGNvbnN0IF9jb2xvciA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKFstMiwgLTAuNSwgMC41LCAyXSlcbiAgICAgIC5yYW5nZShbJyNmNDZkNDMnLCAnIzc0YWRkMScsICcjNzRhZGQxJywgJyM2NmJkNjMnXSlcbiAgICAgIC5pbnRlcnBvbGF0ZShkMy5pbnRlcnBvbGF0ZUxhYik7XG5cbiAgbGV0IF93aWR0aDtcbiAgbGV0IF9oZWlnaHQ7XG4gIGxldCBfbWFyZ2luO1xuICBsZXQgX3N2ZztcbiAgbGV0IF94O1xuICBsZXQgX2JhY2tncm91bmQ7XG4gIGxldCBfZm9yZWdyb3VuZDtcbiAgbGV0IF9kaW1lbnNpb25zO1xuICBsZXQgX2RhdGE7XG4gIGxldCBfbGluZURhdGE7XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgeCBheGlzIHBvc2l0aW9uIGZvciBzb21lIGRpbWVuc3Rpb24gYW5kIGluaXRpYWxpemUgZHJhZ2dpbmdcbiAgICogQHBhcmFtIHtzdHJpbmd9IGQgLSBUaGUgZGltZW5zaW9uIG5hbWVcbiAgICogQHJldHVybiB7ZmxvYXR9IC0gVGhlIGRpc3RhbmNlIHRvIHRoZSByaWdodCBvZiB0aGUgb3JpZ2luXG4gICAqL1xuICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XG4gICAgY29uc3QgdiA9IF9kcmFnZ2luZ1tkXTtcbiAgICByZXR1cm4gdiA/IHYgOiBfeChkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSB0aGUgbGluZSBwYXRoIGZvciBhIGRhdHVtLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZCAtIEFuIG9iamVjdCB3aXRoIGF4aXMgYXR0cmlidXRlc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gU1ZHIHBhdGggdGV4dFxuICAgKi9cbiAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgcmV0dXJuIF9saW5lKF9kaW1lbnNpb25zLm1hcChwID0+IFtwb3NpdGlvbihwKSwgX3lbcF0oZFtwXSldKSk7XG4gIH1cblxuICAvKipcbiAgICogTWFwIGEgbGlzdCBvZiBvYmplY3RzIHdoZXJlIGVhY2ggb2JqZWN0IGlzIGFuIGF0dHJpYnV0ZSB3aXRoIGxpbmUgdmFsdWVzIHRvXG4gICAqICAgICBhIGxpc3Qgb2Ygb2JqZWN0cyB3aGVyZSBlYWNoIG9iamVjdCBpcyBhIGxpbmUgd2l0aCBpdHMgYXR0cmlidXRlcyBsaXN0ZWRcbiAgICogQHBhcmFtIHtsaXN0fSBkYXRhIC0gQSBsaXN0IG9mIG9iamVjdHNcbiAgICogICAgICBlZyB7XG4gICAqICAgICAgICBuYW1lOiBBcmVhLFxuICAgKiAgICAgICAgZGF0YTogWzE0MjM0LCAzNDEzMl0sXG4gICAqICAgICAgICBzY2FsZSA6IGQzLnNjYWxlLmxpbmVhcigpXG4gICAqICAgICAgfVxuICAgKlxuICAgKiBAcmV0dXJuIHtsaXN0fSAtIEEgbGlzdCBvZiBsaW5lIG9iamVjdHNcbiAgICogICAgICBlZyB7XG4gICAqICAgICAgICBBcmVhOiAxNDIzNFxuICAgKiAgICAgICAgQmlyZCBzcGVjaWVzOiA2N1xuICAgKiAgICAgICAgRGlzdGFuY2UgdG8gTWFpbmxhbmQ6IDE0MTY1Ljg1NzQ5XG4gICAqICAgICAgICBMYW5kIHdpdGhpbiA1MDBtOiAyLjYwNTQ2XG4gICAqICAgICAgfVxuICAgKi9cbiAgZnVuY3Rpb24gZGF0YVRvTGluZXMoZGF0YSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGRhdGFbMF0uZGF0YS5mb3JFYWNoKChkLCBpKSA9PiByZXN1bHRbaV0gPSB7fSk7XG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIGZvckVhY2hEaW0oZGltKSB7XG4gICAgICByZXN1bHQuZm9yRWFjaChmdW5jdGlvbiBhZGREaW1EYXRhKGxpbmUsIGkpIHtcbiAgICAgICAgcmVzdWx0W2ldW2RpbS5uYW1lXSA9IGRpbS5kYXRhW2ldO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBjb2xvciBieSB6U2NvcmVcbiAgICogQHBhcmFtIHtsaXN0fSBjb2wgLSBBIGxpc3Qgb2YgdmFsdWVzIHRvIGdlbmVyYXRlIGEgei1zY29yZSBmdW5jdGlvbiBmcm9tXG4gICAqIEByZXR1cm4ge29iamVjdH0gLSBGdW5jdGlvbiB0aGF0IHJldHVybnMgei1zY29yZSByZWxhdGl2ZSB0byB2YWx1ZXMgaW4gY29sXG4gICAqL1xuICBmdW5jdGlvbiB6U2NvcmUoY29sKSB7XG4gICAgY29uc3QgbWVhbiA9IGQzLm1lYW4oY29sKTtcbiAgICBjb25zdCBzaWdtYSA9IGQzLmRldmlhdGlvbihjb2wpO1xuICAgIC8vIFJldHVybiB6U2NvcmUgaWYgc3RkX2RldiBpcyBub3QgMCwgZWxzZSAwXG4gICAgcmV0dXJuIGQgPT4gKHNpZ21hID8gKGQgLSBtZWFuKSAvIHNpZ21hIDogMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIGZvcmVncm91bmQgbGluZSBjb2xvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGltZW5zaW9uIC0gVGhlIG5hbWUgb2YgdGhlIGRpbWVuc2lvbiB0byBjaGFuZ2VcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBmdW5jdGlvbiBjaGFuZ2VDb2xvcihkaW1lbnNpb24pIHtcbiAgICBfc3ZnLnNlbGVjdEFsbCgnLmRpbWVuc2lvbicpXG4gICAgICAgIC5zdHlsZSgnZm9udC13ZWlnaHQnLCAnbm9ybWFsJylcbiAgICAgICAgLmNsYXNzZWQoJ3otc2NvcmVkJywgZmFsc2UpXG4gICAgICAuZmlsdGVyKGQgPT4gZCA9PT0gZGltZW5zaW9uKVxuICAgICAgICAuc3R5bGUoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKVxuICAgICAgICAuY2xhc3NlZCgnei1zY29yZWQnLCB0cnVlKTtcbiAgICBjb25zdCB6ID0gelNjb3JlKF9saW5lRGF0YS5tYXAoaSA9PiBwYXJzZUZsb2F0KGlbZGltZW5zaW9uXSkpKTtcblxuICAgIC8vIGxpbmVzXG4gICAgX3N2Zy5zZWxlY3QoJy5mb3JlZ3JvdW5kJykuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBkID0+IF9jb2xvcih6KGRbZGltZW5zaW9uXSkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92aWRlIGEgY29uc2lzdGVuIHRyYW5zaXRpb24gbGVuZ3RoXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBnIC0gQW4gZDMgc2VsZWN0aW9uIHRoYXQgY2FuIGJlIHRyYW5zaXRpb25lZFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IC0gQSBkMyB0cmFuc2l0aW9uIG9iamVjdFxuICAgKi9cbiAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XG4gIH1cblxuICAvKipcbiAgICogQSBicnVzaHN0YXJ0IGNhbGxiYWNrIGNvbnRyb2xcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xuICAgIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYSBicnVzaCBldmVudCwgdG9nZ2xpbmcgdGhlIGRpc3BsYXkgb2YgZm9yZWdyb3VuZCBsaW5lcy5cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBmdW5jdGlvbiBicnVzaCgpIHtcbiAgICBjb25zdCBhY3RpdmVzID0gX2RpbWVuc2lvbnMuZmlsdGVyKHAgPT4gIV95W3BdLmJydXNoLmVtcHR5KCkpO1xuICAgIGNvbnN0IGV4dGVudHMgPSBhY3RpdmVzLm1hcChwID0+IF95W3BdLmJydXNoLmV4dGVudCgpKTtcbiAgICBfZm9yZWdyb3VuZC5zdHlsZSgnZGlzcGxheScsIGZ1bmN0aW9uIHRvZ2dsZURpc3BsYXkoZCkge1xuICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24gYnJ1c2hlZChwLCBpKSB7XG4gICAgICAgIGNvbnN0IHggPSBNYXRoLnJvdW5kKGRbcF0gKiAxMDApIC8gMTAwO1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChleHRlbnRzW2ldWzBdICogMTAwKSAvIDEwMCA8PSB4ICYmXG4gICAgICAgICAgICAgICAgeCA8PSBNYXRoLnJvdW5kKGV4dGVudHNbaV1bMV0gKiAxMDApIC8gMTAwO1xuICAgICAgfSkgPyBudWxsIDogJ25vbmUnO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIHRoZSBjaGFydCB1c2luZyBwcml2YXRlIHZhcmlhYmxlcyBvbiBjYWxsIHRvIGNoYXJ0LnJlbmRlcigpXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgZnVuY3Rpb24gX2NoYXJ0KCkge1xuICAgIF9zdmcgPSBkMy5zZWxlY3QocGFyZW50KS5hcHBlbmQoJ3N2ZycpXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIF93aWR0aCArIF9tYXJnaW4ubGVmdCArIF9tYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKCdoZWlnaHQnLCBfaGVpZ2h0ICsgX21hcmdpbi50b3AgKyBfbWFyZ2luLmJvdHRvbSlcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgX21hcmdpbi5sZWZ0ICsgJywnICsgX21hcmdpbi50b3AgKyAnKScpO1xuXG4gICAgLy8gQ3JlYXRlIGEgc2NhbGUgZm9yIGVhY2ggZGltZW5zaW9uXG4gICAgX2RhdGEuZm9yRWFjaChmdW5jdGlvbiBpbml0U2NhbGUoZCkge1xuICAgICAgX3lbZC5uYW1lXSA9IChkLnNjYWxlIHx8IGQzLnNjYWxlLmxpbmVhcigpKVxuICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KGQuZGF0YSkpXG4gICAgICAgICAgLnJhbmdlKFtfaGVpZ2h0LCAwXSk7XG4gICAgfSk7XG5cbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIF9kaW1lbnNpb25zXG4gICAgX2RpbWVuc2lvbnMgPSBfZGF0YS5tYXAoZCA9PiBkLm5hbWUpO1xuICAgIF94ID0gZDMuc2NhbGUub3JkaW5hbCgpXG4gICAgICAgIC5kb21haW4oX2RpbWVuc2lvbnMpXG4gICAgICAgIC5yYW5nZVBvaW50cyhbMCwgX3dpZHRoXSwgMSk7XG5cbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxuICAgIF9iYWNrZ3JvdW5kID0gX3N2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYmFja2dyb3VuZCcpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoX2xpbmVEYXRhKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxuICAgIF9mb3JlZ3JvdW5kID0gX3N2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnZm9yZWdyb3VuZCcpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoX2xpbmVEYXRhKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxuICAgIGNvbnN0IGcgPSBfc3ZnLnNlbGVjdEFsbCgnLmRpbWVuc2lvbicpXG4gICAgICAgIC5kYXRhKF9kaW1lbnNpb25zKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpbWVuc2lvbicpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBkID0+ICd0cmFuc2xhdGUoJyArIF94KGQpICsgJyknKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAub3JpZ2luKGQgPT4gKHsgeDogX3goZCkgfSkpXG4gICAgICAgICAgLm9uKCdkcmFnc3RhcnQnLCBmdW5jdGlvbiBvbkRyYWdTdGFydChkKSB7XG4gICAgICAgICAgICBfZHJhZ2dpbmdbZF0gPSBfeChkKTtcbiAgICAgICAgICAgIF9iYWNrZ3JvdW5kLmF0dHIoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbiBvbkRyYWcoZCkge1xuICAgICAgICAgICAgX2RyYWdnaW5nW2RdID0gTWF0aC5taW4oX3dpZHRoLCBNYXRoLm1heCgwLCBkMy5ldmVudC54KSk7XG4gICAgICAgICAgICBfZm9yZWdyb3VuZC5hdHRyKCdkJywgcGF0aCk7XG4gICAgICAgICAgICBfZGltZW5zaW9ucy5zb3J0KChhLCBiKSA9PiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpKTtcbiAgICAgICAgICAgIF94LmRvbWFpbihfZGltZW5zaW9ucyk7XG4gICAgICAgICAgICBnLmF0dHIoJ3RyYW5zZm9ybScsIGIgPT4gJ3RyYW5zbGF0ZSgnICsgcG9zaXRpb24oYikgKyAnKScpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLm9uKCdkcmFnZW5kJywgZnVuY3Rpb24gb25EcmFnRW5kKGQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBfZHJhZ2dpbmdbZF07XG4gICAgICAgICAgICB0cmFuc2l0aW9uKGQzLnNlbGVjdCh0aGlzKSkuYXR0cigndHJhbnNmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0cmFuc2xhdGUoJyArIF94KGQpICsgJyknKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb24oX2ZvcmVncm91bmQpLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICAgICAgICAgIF9iYWNrZ3JvdW5kXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcbiAgICAgICAgICAgICAgICAuYXR0cigndmlzaWJpbGl0eScsIG51bGwpO1xuICAgICAgICAgIH0pKTtcblxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdheGlzJylcbiAgICAgICAgLmVhY2goZnVuY3Rpb24gY2FsbEF4aXMoZCkgeyBkMy5zZWxlY3QodGhpcykuY2FsbChfYXhpcy5zY2FsZShfeVtkXSkpOyB9KVxuICAgICAgICAub24oJ2NsaWNrJywgY2hhbmdlQ29sb3IpXG4gICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLnN0eWxlKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgICAuYXR0cigneScsIC05KVxuICAgICAgICAudGV4dChkID0+IGQpO1xuXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXG4gICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYnJ1c2gnKVxuICAgICAgICAuZWFjaChmdW5jdGlvbiBzdG9yZUJydXNoKGQpIHtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuY2FsbChcbiAgICAgICAgICAgIF95W2RdLmJydXNoID0gZDMuc3ZnLmJydXNoKClcbiAgICAgICAgICAgICAgICAueShfeVtkXSlcbiAgICAgICAgICAgICAgICAub24oJ2JydXNoc3RhcnQnLCBicnVzaHN0YXJ0KVxuICAgICAgICAgICAgICAgIC5vbignYnJ1c2gnLCBicnVzaClcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgLnNlbGVjdEFsbCgncmVjdCcpXG4gICAgICAgIC5hdHRyKCd4JywgLTgpXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIDE2KTtcblxuICAgIC8vIENvbG9yIF9kaW1lbnNpb25zIGJ5IHotc2NvcmVcbiAgICBjaGFuZ2VDb2xvcihfZGltZW5zaW9uc1swXSk7XG4gIH1cblxuICBfY2hhcnQucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHRoaXMuY2FsbCgpO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5yZWRyYXcgPSBmdW5jdGlvbiByZWRyYXcoKSB7XG4gICAgLy8gIEZhZGUgb3V0IGFuZCByZW1vdmUgbGluZXNcbiAgICB0cmFuc2l0aW9uKF9iYWNrZ3JvdW5kKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAucmVtb3ZlKCk7XG4gICAgdHJhbnNpdGlvbihfZm9yZWdyb3VuZClcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMClcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgLy8gQWRqdXN0IGF4ZXMgZG9tYWluc1xuICAgIF9kYXRhLmZvckVhY2goZnVuY3Rpb24gYWRqdXN0QXhpc0RvbWFpbihkKSB7XG4gICAgICBjb25zdCBleHRlbnQgPSBkMy5leHRlbnQoZC5kYXRhKTtcbiAgICAgIGlmIChleHRlbnRbMF0gPT09IGV4dGVudFsxXSkge1xuICAgICAgICBleHRlbnRbMF0gLT0gZXh0ZW50WzBdIC8gMjtcbiAgICAgICAgZXh0ZW50WzFdICs9IGV4dGVudFsxXSAvIDI7XG4gICAgICB9XG4gICAgICBfeVtkLm5hbWVdLmRvbWFpbihleHRlbnQpO1xuICAgIH0pO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBheGVzXG4gICAgX3N2Zy5zZWxlY3RBbGwoJy5heGlzJylcbiAgICAgICAgLmVhY2goZnVuY3Rpb24gdHJhbnNpdGlvbkF4aXMoZCkge1xuICAgICAgICAgIHRyYW5zaXRpb24oZDMuc2VsZWN0KHRoaXMpKS5kZWxheSg1MDApLmNhbGwoX2F4aXMuc2NhbGUoX3lbZF0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBSZWJpbmQgZGF0YVxuICAgIF9iYWNrZ3JvdW5kID0gX3N2Zy5zZWxlY3QoJy5iYWNrZ3JvdW5kJylcbiAgICAgICAgLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgIC5kYXRhKF9saW5lRGF0YSk7XG4gICAgX2ZvcmVncm91bmQgPSBfc3ZnLnNlbGVjdCgnLmZvcmVncm91bmQnKVxuICAgICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgLmRhdGEoX2xpbmVEYXRhKTtcbiAgICAvLyBVcGRhdGVcbiAgICBfYmFja2dyb3VuZFxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpO1xuICAgIF9mb3JlZ3JvdW5kXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDApXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBFbnRlclxuICAgIF9iYWNrZ3JvdW5kLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMClcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICBfZm9yZWdyb3VuZC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDApXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAvLyBVcGRhdGUgY29sb3JcbiAgICBjaGFuZ2VDb2xvcihkMy5zZWxlY3QoJy56LXNjb3JlZCcpLmRhdGEoKVswXSk7XG5cbiAgICAvLyBGYWRlIGluIGxpbmVzXG4gICAgdHJhbnNpdGlvbihfYmFja2dyb3VuZCkuZGVsYXkoMTAwMClcbiAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMC41KTtcbiAgICB0cmFuc2l0aW9uKF9mb3JlZ3JvdW5kKS5kZWxheSgxMDAwKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwLjUpO1xuXG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcblxuICBfY2hhcnQud2lkdGggPSBmdW5jdGlvbiB3aWR0aCh2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF93aWR0aDsgfVxuICAgIF93aWR0aCA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQuaGVpZ2h0ID0gZnVuY3Rpb24gaGVpZ2h0KHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2hlaWdodDsgfVxuICAgIF9oZWlnaHQgPSB2YWw7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0Lm1hcmdpbiA9IGZ1bmN0aW9uIG1hcmdpbih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9tYXJnaW47IH1cbiAgICBfbWFyZ2luID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5kYXRhID0gZnVuY3Rpb24gZGF0YSh2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9kYXRhOyB9XG4gICAgX2RhdGEgPSB2YWw7XG4gICAgX2xpbmVEYXRhID0gZGF0YVRvTGluZXMoX2RhdGEpO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG5cbiAgcmV0dXJuIF9jaGFydDtcbn07XG4iLCIvKiBnbG9iYWwgZDMgc3MgKi9cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIEEgcmV1c2FibGUgZDMgc2NhdHRlcnBsb3QgZ2VuZXJhdG9yXG4gKiBAbmFtZSBzY2F0dGVycGxvdFxuICogQGF1dGhvciBUYXlsb3IgRGVub3VkZW5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnQgfCB7RE9NIGVsZW1lbnR9IHBhcmVudCAtIEEgZG9tIGVsZW1lbnQgdG8gYXBwZW5kIHRoZSB2aXMgdG9cbiAqIEByZXR1cm4ge29iamVjdH0gc2NhdHRlcnBsb3RcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzY2F0dGVycGxvdChwYXJlbnQpIHtcbiAgbGV0IF93aWR0aDtcbiAgbGV0IF9oZWlnaHQ7XG4gIGxldCBfbWFyZ2luO1xuICBsZXQgX2RhdGE7XG4gIGxldCBfeCA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICBsZXQgX3kgPSBkMy5zY2FsZS5saW5lYXIoKTtcbiAgbGV0IF94TG9nID0gZmFsc2U7XG4gIGxldCBfeUxvZyA9IGZhbHNlO1xuICBsZXQgX3hBeGlzO1xuICBsZXQgX3lBeGlzO1xuICBsZXQgX3hBY2Nlc3NvcjtcbiAgbGV0IF95QWNjZXNzb3I7XG4gIGxldCBfeExhYmVsO1xuICBsZXQgX3lMYWJlbDtcbiAgbGV0IF9jb2xvciA9IGQzLnNjYWxlLmNhdGVnb3J5MTAoKTtcbiAgbGV0IF9jb2xvckFjY2Vzc29yID0gKCkgPT4gMDtcbiAgbGV0IF9rZXlBY2Nlc3NvciA9IGQgPT4gZC5rZXk7XG4gIGxldCBfcmFkaXVzID0gNTtcbiAgbGV0IF9yZWdMaW5lO1xuICBsZXQgX3JTcXVhcmVkID0gMTtcbiAgbGV0IF9jb3JyZWxhdGlvbiA9IDE7XG4gIGxldCBfY292YXJpYW5jZSA9IDE7XG4gIGxldCBfc3ZnO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGJhc2UgdGVuIGxvZyBvZiBhIE51bWJlclxuICAgKiBAcGFyYW0ge251bWJlcn0gZCAtIEEgbnVtYmVyIHRvIGFwcGx5IHRoZSBvcGVyYXRpb24gb25cbiAgICogQHJldHVybiB7bnVtYmVyfSBsb2cgYmFzZSAxMCBvZiBkXG4gICAqL1xuICBmdW5jdGlvbiBsb2cxMChkKSB7XG4gICAgcmV0dXJuIE1hdGgubG9nKGQpIC8gTWF0aC5sb2coMTApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGFuIHggdmFsdWUgb2YgdW4tdHJhbnNmb3JtZWQgZGF0YSAobm8gbG9nIHRyYW5zZm9ybSBldGMuKSxcbiAgICogZ2V0IHRoZSB1bnRyYW5zZm9ybWVkIHkgY29vcmRpbmF0ZSBmcm9tIHRoZSByZWdyZXNzaW9uIGxpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgdW50cmFuc2Zvcm1lZCB4IHZhbHVlIGluIGxpbmVhciBzcGFjZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWdMaW5lIC0gVGhlIHJlZ3Jlc3Npb24gbGluZSBjYWxjdWxhdGVkIHVzaW5nXG4gICAqICAgIGEgdHJhbnNmb3JtZWQgZGF0YXNldCB0aGF0IGFjY291bnRlZCBmb3IgdGhlIGxvZyBzY2FsZXNcbiAgICogQHJldHVybiB7bnVtYmVyfSB5IC0gVGhlIHVudHJhbnNmb3JtZWQgeSB2YWx1ZSBpbiBsaW5lYXIgc3BhY2UgdG8gcGxvdCBvbiB0aGUgY2hhcnRcbiAgICovXG4gIGZ1bmN0aW9uIGdldFkoeCwgcmVnTGluZSkge1xuICAgIGNvbnN0IHkgPSByZWdMaW5lKF94TG9nID8gbG9nMTAoeCkgOiB4KTtcbiAgICByZXR1cm4gX3lMb2cgPyBNYXRoLnBvdygxMCwgeSkgOiB5O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBhbGwgY2hhcnQgc3RhdGlzdGljYWwgdmFsdWVzIGFuZCByZWdyZXNzbGlvbiBsaW5lYXJSZWdyZXNzaW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0W119IGRhdGEgLSBUaGUgZGF0YXNldCB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgc3RhdGlzdGljc1xuICAgKiBAcmV0dXJuIHtPYmplY3R9IHN0YXRzIC0gQW4gb2JqZWN0IHdpdGggYWxsIGNhbGN1bGF0ZWQgc3RhdGlzdGljc1xuICAgKi9cbiAgZnVuY3Rpb24gY2FsY3VsYXRlU3RhdHMoZGF0YSkge1xuICAgIC8vIEdldCByZWdyZXNzaW9uIGxpbmUgZm9ybXVsYVxuICAgIGNvbnN0IHNzRGF0YSA9IGRhdGEubWFwKGZ1bmN0aW9uIHNzRGF0YShkKSB7XG4gICAgICBjb25zdCB4RCA9IF94TG9nID8gbG9nMTAoX3hBY2Nlc3NvcihkKSkgOiBfeEFjY2Vzc29yKGQpO1xuICAgICAgY29uc3QgeUQgPSBfeUxvZyA/IGxvZzEwKF95QWNjZXNzb3IoZCkpIDogX3lBY2Nlc3NvcihkKTtcbiAgICAgIHJldHVybiBbeEQsIHlEXTtcbiAgICB9KTtcbiAgICBjb25zdCBtYiA9IHNzLmxpbmVhclJlZ3Jlc3Npb24oc3NEYXRhKTtcbiAgICBjb25zdCByZWdMaW5lID0gc3MubGluZWFyUmVncmVzc2lvbkxpbmUobWIpO1xuXG4gICAgLy8gQ2FsY3VsYXRlZCBzdGF0aXN0aWNzXG4gICAgY29uc3QgclNxdWFyZWQgPSBzcy5yU3F1YXJlZChzc0RhdGEsIHJlZ0xpbmUpO1xuICAgIGNvbnN0IGNvcnJlbGF0aW9uID0gc3Muc2FtcGxlQ29ycmVsYXRpb24oXG4gICAgICBzc0RhdGEubWFwKGQgPT4gZFswXSksXG4gICAgICBzc0RhdGEubWFwKGQgPT4gZFsxXSlcbiAgICApO1xuICAgIGNvbnN0IGNvdmFyaWFuY2UgPSBzcy5zYW1wbGVDb3ZhcmlhbmNlKFxuICAgICAgc3NEYXRhLm1hcChkID0+IGRbMF0pLFxuICAgICAgc3NEYXRhLm1hcChkID0+IGRbMV0pXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICByZWc6IG1iLFxuICAgICAgcmVnTGluZSxcbiAgICAgIHJTcXVhcmVkLFxuICAgICAgY29ycmVsYXRpb24sXG4gICAgICBjb3ZhcmlhbmNlLFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY2hhcnQoKSB7XG4gICAgLy8gQ3JlYXRlIHN2ZyBvYmplY3RcbiAgICBfc3ZnID0gZDMuc2VsZWN0KHBhcmVudCkuYXBwZW5kKCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgX3dpZHRoICsgX21hcmdpbi5sZWZ0ICsgX21hcmdpbi5yaWdodClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBfaGVpZ2h0ICsgX21hcmdpbi50b3AgKyBfbWFyZ2luLmJvdHRvbSlcbiAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBfbWFyZ2luLmxlZnQgKyAnLCcgKyBfbWFyZ2luLnRvcCArICcpJyk7XG5cbiAgICAvLyBDcmVhdGUgY2xlYW5lZCBkYXRhc2V0IHRoYXQgZG9lc24ndCBpbmNsdWRlIG5vbiBudW1lcmljIG9yIGxvZygwKSB2YWx1ZXNcbiAgICBjb25zdCBjbGVhbkRhdGEgPSBfZGF0YVxuICAgICAgICAuZmlsdGVyKGQgPT4gIShpc05hTihfeEFjY2Vzc29yKGQpKSB8fCBpc05hTihfeUFjY2Vzc29yKGQpKSkpXG4gICAgICAgIC5maWx0ZXIoZCA9PiAhKChfeExvZyAmJiBfeEFjY2Vzc29yKGQpID09PSAwKSB8fCAoX3lMb2cgJiYgX3lBY2Nlc3NvcihkKSA9PT0gMCkpKTtcblxuICAgIC8vIFNldCB4IGFuZCB5IGF4aXMgYmFzZWQgb24gc2VsZWN0ZWQgYXR0cmlidXRlc1xuICAgIF94LmRvbWFpbihkMy5leHRlbnQoY2xlYW5EYXRhLCBfeEFjY2Vzc29yKSlcbiAgICAgIC5yYW5nZShbMCwgX3dpZHRoXSk7XG4gICAgX3kuZG9tYWluKGQzLmV4dGVudChjbGVhbkRhdGEsIF95QWNjZXNzb3IpKVxuICAgICAgLnJhbmdlKFtfaGVpZ2h0LCAwXSk7XG5cbiAgICAvLyBDcmVhdGUgc3ZnIGF4aXMgZ2VuZXJhdG9yc1xuICAgIF94QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShfeClcbiAgICAgIC5vcmllbnQoJ2JvdHRvbScpXG4gICAgICAudGlja1NpemUoLV9oZWlnaHQpO1xuICAgIF95QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShfeSlcbiAgICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgICAgLnRpY2tTaXplKC1fd2lkdGgpO1xuXG4gICAgLy8gQWRkIGF4ZXMgdG8gY2hhcnRcbiAgICBfc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAnICsgX2hlaWdodCArICcpJylcbiAgICAgICAgLmNhbGwoX3hBeGlzKTtcbiAgICBfc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKVxuICAgICAgICAuY2FsbChfeUF4aXMpO1xuXG4gICAgLy8gQWRkIGF4aXMgbGFiZWxzXG4gICAgX3N2Zy5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAneCBsYWJlbCcpXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAuYXR0cigneCcsIF93aWR0aCAtIDEwKVxuICAgICAgICAuYXR0cigneScsIF9oZWlnaHQgLSA1KVxuICAgICAgICAudGV4dChfeExhYmVsKTtcbiAgICBfc3ZnLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd5IGxhYmVsJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICdyb3RhdGUoLTkwKScpXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAuYXR0cigneCcsIC01KVxuICAgICAgICAuYXR0cigneScsIDEwKVxuICAgICAgICAudGV4dChfeUxhYmVsKTtcblxuICAgIC8vIEFkZCBmcmFtZSBhcm91bmQgY2hhcnRcbiAgICBfc3ZnLmFwcGVuZCgncmVjdCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdmcmFtZScpXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIF93aWR0aClcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIF9oZWlnaHQpO1xuXG4gICAgLy8gQ3JlYXRlIGNsaXAgcGF0aFxuICAgIF9zdmcuYXBwZW5kKCdkZWZzJylcbiAgICAgIC5hcHBlbmQoJ2NsaXBQYXRoJylcbiAgICAgICAgLmF0dHIoJ2lkJywgJ2NoYXJ0Q2xpcCcpXG4gICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgLmF0dHIoJ3dpZHRoJywgX3dpZHRoKVxuICAgICAgICAuYXR0cignaGVpZ2h0JywgX2hlaWdodCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgc3RhdGlzdGljcyBhbmQgcmVncmVzc2lvbiBsaW5lXG4gICAgY29uc3Qgc3RhdHMgPSBjYWxjdWxhdGVTdGF0cyhjbGVhbkRhdGEpO1xuICAgIF9yZWdMaW5lID0gc3RhdHMucmVnTGluZTtcbiAgICBfclNxdWFyZWQgPSBzdGF0cy5yU3F1YXJlZDtcbiAgICBfY29ycmVsYXRpb24gPSBzdGF0cy5jb3JyZWxhdGlvbjtcbiAgICBfY292YXJpYW5jZSA9IHN0YXRzLmNvdmFyaWFuY2U7XG5cbiAgICAvLyBBZGQgcmVncmVzc2lvbiBsaW5lIHRvIENoYXJ0XG4gICAgX3N2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAncmVncmVzc2lvbicpXG4gICAgICAgIC5hdHRyKCdjbGlwLXBhdGgnLCAndXJsKCNjaGFydENsaXApJylcbiAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdibGFjaycpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS1kYXNoYXJyYXknLCAnNSw1LDEwLDUnKVxuICAgICAgICAuYXR0cigneDEnLCBfeChfeC5kb21haW4oKVswXSkpXG4gICAgICAgIC5hdHRyKCd5MScsIF95KGdldFkoX3guZG9tYWluKClbMF0sIF9yZWdMaW5lKSkpXG4gICAgICAgIC5hdHRyKCd4MicsIF94KF94LmRvbWFpbigpWzFdKSlcbiAgICAgICAgLmF0dHIoJ3kyJywgX3koZ2V0WShfeC5kb21haW4oKVsxXSwgX3JlZ0xpbmUpKSk7XG5cbiAgICAvLyBBZGQgZGF0YSBtYXJrcyB0byBjaGFydFxuICAgIGNvbnN0IG1hcmtzID0gX3N2Zy5zZWxlY3RBbGwoJ2cubWFyaycpXG4gICAgICAgIC5kYXRhKGNsZWFuRGF0YSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdtYXJrJyk7XG5cbiAgICBtYXJrcy5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgIC5hdHRyKCdjeCcsIGQgPT4gX3goX3hBY2Nlc3NvcihkKSkpXG4gICAgICAgIC5hdHRyKCdjeScsIGQgPT4gX3koX3lBY2Nlc3NvcihkKSkpXG4gICAgICAgIC5hdHRyKCdyJywgX3JhZGl1cylcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCBkID0+IF9jb2xvcihfY29sb3JBY2Nlc3NvcihkKSkpO1xuXG4gICAgbWFya3MuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLnRleHQoX2tleUFjY2Vzc29yKVxuICAgICAgICAuYXR0cigneCcsIGQgPT4gX3goX3hBY2Nlc3NvcihkKSkpXG4gICAgICAgIC5hdHRyKCd5JywgZCA9PiBfeShfeUFjY2Vzc29yKGQpKSlcbiAgICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgIC5hdHRyKCdkeScsIC01KVxuICAgICAgICAuYXR0cignZHgnLCAtMik7XG4gIH1cblxuICBfY2hhcnQucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHRoaXMuY2FsbCgpO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5yZWRyYXcgPSBmdW5jdGlvbiByZWRyYXcoKSB7XG4gICAgLy8gQ3JlYXRlIGNsZWFuZWQgZGF0YXNldCB0aGF0IGRvZXNuJ3QgaW5jbHVkZSBub24gbnVtZXJpYyBvciBsb2coMCkgdmFsdWVzXG4gICAgY29uc3QgY2xlYW5EYXRhID0gX2RhdGFcbiAgICAgICAgLmZpbHRlcihkID0+ICEoaXNOYU4oX3hBY2Nlc3NvcihkKSkgfHwgaXNOYU4oX3lBY2Nlc3NvcihkKSkpKVxuICAgICAgICAuZmlsdGVyKGQgPT4gISgoX3hMb2cgJiYgX3hBY2Nlc3NvcihkKSA9PT0gMCkgfHwgKF95TG9nICYmIF95QWNjZXNzb3IoZCkgPT09IDApKSk7XG5cbiAgICAvLyBVcGRhdGUgeCBhbmQgeSBkb21haW5cbiAgICBfeC5kb21haW4oZDMuZXh0ZW50KGNsZWFuRGF0YSwgX3hBY2Nlc3NvcikpXG4gICAgICAucmFuZ2UoWzAsIF93aWR0aF0pO1xuICAgIF95LmRvbWFpbihkMy5leHRlbnQoY2xlYW5EYXRhLCBfeUFjY2Vzc29yKSlcbiAgICAgIC5yYW5nZShbX2hlaWdodCwgMF0pO1xuXG4gICAgLy8gVXBkYXRlIGF4ZXMgZ2VuZXJhdG9yIHNjYWxlXG4gICAgX3hBeGlzLnNjYWxlKF94KTtcbiAgICBfeUF4aXMuc2NhbGUoX3kpO1xuXG4gICAgLy8gRGVmaW5lIGNvbnNpc3RlbnQgdHJhbnNpdGlvbiBkdXJhdGlvblxuICAgIGNvbnN0IHQgPSAxNTAwO1xuXG4gICAgLy8gVXBkYXRlIGF4ZXNcbiAgICBfc3ZnLnNlbGVjdCgnLnguYXhpcycpXG4gICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24odClcbiAgICAgICAgLmNhbGwoX3hBeGlzKTtcbiAgICBfc3ZnLnNlbGVjdCgnLnkuYXhpcycpXG4gICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24odClcbiAgICAgICAgLmNhbGwoX3lBeGlzKTtcblxuICAgIC8vIFVwZGF0ZSBheGlzIGxhYmVsc1xuICAgIF9zdmcuc2VsZWN0KCcueC5sYWJlbCcpXG4gICAgICAgIC50ZXh0KF94TGFiZWwpO1xuICAgIF9zdmcuc2VsZWN0KCcueS5sYWJlbCcpXG4gICAgICAgIC50ZXh0KF95TGFiZWwpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIHN0YXRpc3RpY3MgYW5kIHJlZ3Jlc3Npb24gbGluZVxuICAgIGNvbnN0IHN0YXRzID0gY2FsY3VsYXRlU3RhdHMoY2xlYW5EYXRhKTtcbiAgICBfcmVnTGluZSA9IHN0YXRzLnJlZ0xpbmU7XG4gICAgX3JTcXVhcmVkID0gc3RhdHMuclNxdWFyZWQ7XG4gICAgX2NvcnJlbGF0aW9uID0gc3RhdHMuY29ycmVsYXRpb247XG4gICAgX2NvdmFyaWFuY2UgPSBzdGF0cy5jb3ZhcmlhbmNlO1xuXG4gICAgLy8gQWRkIHJlZ3Jlc3Npb24gbGluZSB0byBDaGFydFxuICAgIF9zdmcuc2VsZWN0KCcucmVncmVzc2lvbiBsaW5lJylcbiAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24odClcbiAgICAgICAgLmF0dHIoJ3gxJywgX3goX3guZG9tYWluKClbMF0pKVxuICAgICAgICAuYXR0cigneTEnLCBfeShnZXRZKF94LmRvbWFpbigpWzBdLCBfcmVnTGluZSkpKVxuICAgICAgICAuYXR0cigneDInLCBfeChfeC5kb21haW4oKVsxXSkpXG4gICAgICAgIC5hdHRyKCd5MicsIF95KGdldFkoX3guZG9tYWluKClbMV0sIF9yZWdMaW5lKSkpO1xuXG4gICAgLy8gVXBkYXRlIGRhdGEgYW5kIG1hcmsgcG9zaXRpb25zXG4gICAgY29uc3QgbWFya3MgPSBfc3ZnLnNlbGVjdEFsbCgnZy5tYXJrJylcbiAgICAgICAgLmRhdGEoY2xlYW5EYXRhLCBfa2V5QWNjZXNzb3IpO1xuXG4gICAgLy8gVXBkYXRlXG4gICAgbWFya3Muc2VsZWN0QWxsKCdjaXJjbGUnKVxuICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0KVxuICAgICAgICAuYXR0cignY3gnLCBkID0+IF94KF94QWNjZXNzb3IoZCkpKVxuICAgICAgICAuYXR0cignY3knLCBkID0+IF95KF95QWNjZXNzb3IoZCkpKVxuICAgICAgICAuYXR0cigncicsIF9yYWRpdXMpXG4gICAgICAgIC5hdHRyKCdmaWxsJywgZCA9PiBfY29sb3IoX2NvbG9yQWNjZXNzb3IoZCkpKTtcblxuICAgIG1hcmtzLnNlbGVjdEFsbCgndGV4dCcpXG4gICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKHQpXG4gICAgICAgIC5hdHRyKCd4JywgZCA9PiBfeChfeEFjY2Vzc29yKGQpKSlcbiAgICAgICAgLmF0dHIoJ3knLCBkID0+IF95KF95QWNjZXNzb3IoZCkpKTtcblxuICAgIC8vIEVudGVyXG4gICAgY29uc3QgZyA9IG1hcmtzLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21hcmsnKTtcblxuICAgIGcuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAuYXR0cignY3gnLCBkID0+IF94KF94QWNjZXNzb3IoZCkpKVxuICAgICAgICAuYXR0cignY3knLCBkID0+IF95KF95QWNjZXNzb3IoZCkpKVxuICAgICAgICAuYXR0cigncicsIF9yYWRpdXMpXG4gICAgICAgIC5hdHRyKCdmaWxsJywgZCA9PiBfY29sb3IoX2NvbG9yQWNjZXNzb3IoZCkpKTtcblxuICAgIGcuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLnRleHQoX2tleUFjY2Vzc29yKVxuICAgICAgICAuYXR0cigneCcsIGQgPT4gX3goX3hBY2Nlc3NvcihkKSkpXG4gICAgICAgIC5hdHRyKCd5JywgZCA9PiBfeShfeUFjY2Vzc29yKGQpKSlcbiAgICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgIC5hdHRyKCdkeScsIC01KVxuICAgICAgICAuYXR0cignZHgnLCAtMik7XG5cbiAgICAvLyBFeGl0XG4gICAgbWFya3MuZXhpdCgpLnJlbW92ZSgpO1xuXG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LndpZHRoID0gZnVuY3Rpb24gd2lkdGgodmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfd2lkdGg7IH1cbiAgICBfd2lkdGggPSB2YWw7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LmhlaWdodCA9IGZ1bmN0aW9uIGhlaWdodCh2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9oZWlnaHQ7IH1cbiAgICBfaGVpZ2h0ID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC5tYXJnaW4gPSBmdW5jdGlvbiBtYXJnaW4odmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfbWFyZ2luOyB9XG4gICAgX21hcmdpbiA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQuZGF0YSA9IGZ1bmN0aW9uIGRhdGEodmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfZGF0YTsgfVxuICAgIF9kYXRhID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC54QWNjZXNzb3IgPSBmdW5jdGlvbiB4QWNjZXNzb3IodmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfeEFjY2Vzc29yOyB9XG4gICAgX3hBY2Nlc3NvciA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQueUFjY2Vzc29yID0gZnVuY3Rpb24geUFjY2Vzc29yKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3lBY2Nlc3NvcjsgfVxuICAgIF95QWNjZXNzb3IgPSB2YWw7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LnhMYWJlbCA9IGZ1bmN0aW9uIHhMYWJlbCh2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF94TGFiZWw7IH1cbiAgICBfeExhYmVsID0gdmFsO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC55TGFiZWwgPSBmdW5jdGlvbiB5TGFiZWwodmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfeUxhYmVsOyB9XG4gICAgX3lMYWJlbCA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQueExvZyA9IGZ1bmN0aW9uIHhMb2codmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfeExvZzsgfVxuICAgIF94TG9nID0gdmFsO1xuICAgIF94ID0gX3hMb2cgPyBkMy5zY2FsZS5sb2coKSA6IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHJldHVybiBfY2hhcnQ7XG4gIH07XG4gIF9jaGFydC55TG9nID0gZnVuY3Rpb24geUxvZyh2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF95TG9nOyB9XG4gICAgX3lMb2cgPSB2YWw7XG4gICAgX3kgPSBfeUxvZyA/IGQzLnNjYWxlLmxvZygpIDogZDMuc2NhbGUubGluZWFyKCk7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LmNvbG9yID0gZnVuY3Rpb24gY29sb3IodmFsKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiBfY29sb3I7IH1cbiAgICBfY29sb3IgPSB2YWw7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LmNvbG9yQWNjZXNzb3IgPSBmdW5jdGlvbiBjb2xvckFjY2Vzc29yKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX2NvbG9yQWNjZXNzb3I7IH1cbiAgICBfY29sb3JBY2Nlc3NvciA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQua2V5QWNjZXNzb3IgPSBmdW5jdGlvbiBrZXlBY2Nlc3Nvcih2YWwpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIF9rZXlBY2Nlc3NvcjsgfVxuICAgIF9rZXlBY2Nlc3NvciA9IHZhbDtcbiAgICByZXR1cm4gX2NoYXJ0O1xuICB9O1xuICBfY2hhcnQucmFkaXVzID0gZnVuY3Rpb24gcmFkaXVzKHZhbCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gX3JhZGl1czsgfVxuICAgIF9yYWRpdXMgPSB2YWw7XG4gICAgcmV0dXJuIF9jaGFydDtcbiAgfTtcbiAgX2NoYXJ0LnJTcXVhcmVkID0gZnVuY3Rpb24gclNxdWFyZWQoKSB7XG4gICAgcmV0dXJuIF9yU3F1YXJlZDtcbiAgfTtcbiAgX2NoYXJ0LmNvcnJlbGF0aW9uID0gZnVuY3Rpb24gY29ycmVsYXRpb24oKSB7XG4gICAgcmV0dXJuIF9jb3JyZWxhdGlvbjtcbiAgfTtcbiAgX2NoYXJ0LmNvdmFyaWFuY2UgPSBmdW5jdGlvbiBjb3ZhcmlhbmNlKCkge1xuICAgIHJldHVybiBfY292YXJpYW5jZTtcbiAgfTtcblxuICByZXR1cm4gX2NoYXJ0O1xufTtcbiJdfQ==
