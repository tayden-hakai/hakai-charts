/* global d3 */

/**
 * A reusable d3 parallel coordinates generator with statistical coloring
 * @name parallelCoordinates
 * @author Taylor Denouden
 * @param {string} parent | {DOM element} parent - A dom element to append the vis to
 * @return {object} parallelCoordinates
 */
module.exports = function parallelCoordinates(parent) {
  const _y = {};
  const _dragging = {};
  const _line = d3.svg.line();
  const _axis = d3.svg.axis().orient('left');
  const _color = d3.scale.linear()
      .domain([-2, -0.5, 0.5, 2])
      .range(['#f46d43', '#74add1', '#74add1', '#66bd63'])
      .interpolate(d3.interpolateLab);

  let _width;
  let _height;
  let _margin;
  let _svg;
  let _x;
  let _background;
  let _foreground;
  let _dimensions;
  let _data;
  let _lineData;

  /**
   * Get the x axis position for some dimension and initialize dragging
   * @param {string} d - The dimension name
   * @return {float} - The distance to the right of the origin
   */
  function position(d) {
    const v = _dragging[d];
    return v ? v : _x(d);
  }

  /**
   * Generate the line path for a datum.
   * @param {object} d - An object with axis attributes
   * @return {string} - SVG path text
   */
  function path(d) {
    return _line(_dimensions.map(p => [position(p), _y[p](d[p])]));
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
    const result = [];
    data[0].data.forEach((d, i) => result[i] = {});
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
    const mean = d3.mean(col);
    const sigma = d3.deviation(col);
    // Return zScore if std_dev is not 0, else 0
    return d => (sigma ? (d - mean) / sigma : 0);
  }

  /**
   * Change foreground line color
   * @param {string} dimension - The name of the dimension to change
   * @returns {void}
   */
  function changeColor(dimension) {
    _svg.selectAll('.dimension')
        .style('font-weight', 'normal')
        .classed('z-scored', false)
      .filter(d => d === dimension)
        .style('font-weight', 'bold')
        .classed('z-scored', true);
    const z = zScore(_lineData.map(i => parseFloat(i[dimension])));

    // lines
    _svg.select('.foreground').selectAll('path')
        .style('stroke', d => _color(z(d[dimension])));
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
    const actives = _dimensions.filter(p => !_y[p].brush.empty());
    const extents = actives.map(p => _y[p].brush.extent());
    _foreground.style('display', function toggleDisplay(d) {
      return actives.every(function brushed(p, i) {
        const x = Math.round(d[p] * 100) / 100;
        return Math.round(extents[i][0] * 100) / 100 <= x &&
                x <= Math.round(extents[i][1] * 100) / 100;
      }) ? null : 'none';
    });
  }

  /**
   * Generate the chart using private variables on call to chart.render()
   * @returns {void}
   */
  function _chart() {
    _svg = d3.select(parent).append('svg')
        .attr('width', _width + _margin.left + _margin.right)
        .attr('height', _height + _margin.top + _margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

    // Create a scale for each dimension
    _data.forEach(function initScale(d) {
      _y[d.name] = (d.scale || d3.scale.linear())
          .domain(d3.extent(d.data))
          .range([_height, 0]);
    });

    // Extract the list of _dimensions
    _dimensions = _data.map(d => d.name);
    _x = d3.scale.ordinal()
        .domain(_dimensions)
        .rangePoints([0, _width], 1);

    // Add grey background lines for context.
    _background = _svg.append('g')
        .attr('class', 'background')
      .selectAll('path')
        .data(_lineData)
      .enter().append('path')
        .attr('d', path);

    // Add blue foreground lines for focus.
    _foreground = _svg.append('g')
        .attr('class', 'foreground')
      .selectAll('path')
        .data(_lineData)
      .enter().append('path')
        .attr('d', path);

    // Add a group element for each dimension.
    const g = _svg.selectAll('.dimension')
        .data(_dimensions)
      .enter().append('g')
        .attr('class', 'dimension')
        .attr('transform', d => 'translate(' + _x(d) + ')')
        .call(d3.behavior.drag()
          .origin(d => ({ x: _x(d) }))
          .on('dragstart', function onDragStart(d) {
            _dragging[d] = _x(d);
            _background.attr('visibility', 'hidden');
          })
          .on('drag', function onDrag(d) {
            _dragging[d] = Math.min(_width, Math.max(0, d3.event.x));
            _foreground.attr('d', path);
            _dimensions.sort((a, b) => position(a) - position(b));
            _x.domain(_dimensions);
            g.attr('transform', b => 'translate(' + position(b) + ')');
          })
          .on('dragend', function onDragEnd(d) {
            delete _dragging[d];
            transition(d3.select(this)).attr('transform',
                                             'translate(' + _x(d) + ')');
            transition(_foreground).attr('d', path);
            _background
                .attr('d', path)
              .transition()
                .delay(500)
                .duration(0)
                .attr('visibility', null);
          }));

    // Add an axis and title.
    g.append('g')
        .attr('class', 'axis')
        .each(function callAxis(d) { d3.select(this).call(_axis.scale(_y[d])); })
        .on('click', changeColor)
      .append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text(d => d);

    // Add and store a brush for each axis.
    g.append('g')
        .attr('class', 'brush')
        .each(function storeBrush(d) {
          d3.select(this).call(
            _y[d].brush = d3.svg.brush()
                .y(_y[d])
                .on('brushstart', brushstart)
                .on('brush', brush)
          );
        })
      .selectAll('rect')
        .attr('x', -8)
        .attr('width', 16);

    // Color _dimensions by z-score
    changeColor(_dimensions[0]);
  }

  _chart.render = function render() {
    this.call();
    return _chart;
  };
  _chart.redraw = function redraw() {
    //  Fade out and remove lines
    transition(_background)
        .style('opacity', 0)
      .transition()
        .remove();
    transition(_foreground)
        .style('opacity', 0)
      .transition()
        .remove();

    // Adjust axes domains
    _data.forEach(function adjustAxisDomain(d) {
      const extent = d3.extent(d.data);
      if (extent[0] === extent[1]) {
        extent[0] -= extent[0] / 2;
        extent[1] += extent[1] / 2;
      }
      _y[d.name].domain(extent);
    });

    // Transition axes
    _svg.selectAll('.axis')
        .each(function transitionAxis(d) {
          transition(d3.select(this)).delay(500).call(_axis.scale(_y[d]));
        });

    // Rebind data
    _background = _svg.select('.background')
        .selectAll('path')
        .data(_lineData);
    _foreground = _svg.select('.foreground')
        .selectAll('path')
        .data(_lineData);
    // Update
    _background
        .style('opacity', 0)
        .attr('d', path);
    _foreground
        .style('opacity', 0)
        .attr('d', path);

    // Enter
    _background.enter().append('path')
        .style('opacity', 0)
        .attr('d', path);
    _foreground.enter().append('path')
        .style('opacity', 0)
        .attr('d', path);

    // Update color
    changeColor(d3.select('.z-scored').data()[0]);

    // Fade in lines
    transition(_background).delay(1000)
        .style('opacity', 0.5);
    transition(_foreground).delay(1000)
        .style('opacity', 0.5);

    return _chart;
  };

  _chart.width = function width(val) {
    if (!arguments.length) { return _width; }
    _width = val;
    return _chart;
  };
  _chart.height = function height(val) {
    if (!arguments.length) { return _height; }
    _height = val;
    return _chart;
  };
  _chart.margin = function margin(val) {
    if (!arguments.length) { return _margin; }
    _margin = val;
    return _chart;
  };
  _chart.data = function data(val) {
    if (!arguments.length) { return _data; }
    _data = val;
    _lineData = dataToLines(_data);
    return _chart;
  };

  return _chart;
};
