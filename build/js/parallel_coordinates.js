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
//# sourceMappingURL=parallel_coordinates.js.map
