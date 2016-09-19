import * as d3 from 'd3';

// Load stylesheet
require('../styles/para_coords.scss');

/**
 * A reusable d3 parallel coordinates generator with statistical coloring
 * @name parallelCoordinates
 * @module parallelCoordinates
 * @memberof hakaiCharts
 * @author Taylor Denouden
 * @param {String|DOM_node} parent - A dom element to append the chart to
 * @return {parallelCoordinatesChart}
 */
module.exports = function parallelCoordinates(parent) {
  const _dragging = {};
  const _line = d3.line();
  const _axis = d3.axisLeft();
  let _y = {};
  let _yAccessors = {};
  let _color = d3.schemeCategory10;
  let _colorAccessor = () => 0;
  let _width;
  let _height;
  let _margin;
  let _svg;
  let _x;
  let _background;
  let _foreground;
  let _dimensions;
  let _data;
  let _onClick = () => {};

  /**
   * Get the x axis position for some dimension and initialize dragging
   * @private
   * @param {string} d - The dimension name
   * @return {float} - The distance to the right of the origin
   */
  function position(d) {
    return _dragging[d] || _x(d);
  }

  /**
   * Generate the line path for a datum.
   * @private
   * @param {object} d - An object with axis attributes
   * @return {string} - SVG path text
   */
  function path(d) {
    return _line(_dimensions.map(dim =>
      [position(dim), _y[dim](_yAccessors[dim](d))]
    ));
  }

  /**
   * Provide a consistent transition length
   * @private
   * @param {object} g - An d3 selection that can be transitioned
   * @return {object} - A d3 transition object
   */
  function transition(g) {
    return g.transition().duration(500);
  }

  /**
   * Handles a brush event, toggling the display of foreground lines.
   * @private
   * @returns {void}
   */
  function brush() {
    // Get dimensions in original sort order
    const dims = _svg.selectAll('.dimension');

    // Get all axes brush extents
    const extents = dims.select('.brush').nodes()
        .map(d => d3.brushSelection(d));

    _foreground.style('display', (d) => {
      return dims.data().every((dim, i) => {
        const lineVal = _y[dim](_yAccessors[dim](d));
        const dimExtent = extents[i];

        // show line if axis not brushed or line value falls within brush extent
        return !dimExtent || (lineVal > dimExtent[0] && lineVal < dimExtent[1]);
      }) ? null : 'none';
    });
  }

  /**
   * Generate the chart using private variables on call to chart.render()
   * @private
   * @returns {parallelCoordinates}
   */
  function _chart() {
    _svg = d3.select(parent).append('svg')
        .attr('class', 'parallel-coordinates')
        .attr('width', _width + _margin.left + _margin.right)
        .attr('height', _height + _margin.top + _margin.bottom)
      .append('g')
        .attr('transform', `translate(${_margin.left}, ${_margin.top})`);

    // Create a scale for each dimension
    Object.keys(_yAccessors).forEach((k) => {
      _y[k] = (_y[k] || d3.scaleLinear())
          .domain(d3.extent(_data.map(d => _yAccessors[k](d))))
          .range([_height, 0]);
    });

    // Extract the list of _dimensions
    _dimensions = Object.keys(_yAccessors);
    _x = d3.scaleBand()
        .domain(_dimensions)
        .range([0, _width])
        .padding(1);

    // Add grey background lines for context.
    _background = _svg.append('g')
        .attr('class', 'background')
      .selectAll('path')
        .data(_data)
      .enter().append('path')
        .attr('d', path);

    // Add blue foreground lines for focus.
    _foreground = _svg.append('g')
        .attr('class', 'foreground')
      .selectAll('path')
        .data(_data)
      .enter().append('path')
        .attr('d', path)
        .style('stroke', d => _color(_colorAccessor(d)));

    // Add a group element for each dimension.
    const g = _svg.selectAll('.dimension')
        .data(_dimensions)
      .enter().append('g')
        .attr('class', 'dimension')
        .attr('transform', d => `translate(${_x(d)})`)
         .call(d3.drag()
           .on('start', (d) => {
             _dragging[d] = _x(d);
             _background.attr('visibility', 'hidden');
           })
           .on('drag', (d) => {
             _dragging[d] = Math.min(_width, Math.max(0, d3.event.x));
             _foreground.attr('d', path);
             _dimensions.sort((a, b) => position(a) - position(b));
             _x.domain(_dimensions);
             g.attr('transform', b => `translate(${position(b)})`);
           })
           .on('end', function onDragEnd(d) {
             delete _dragging[d];
             transition(d3.select(this)).attr('transform', `translate(${_x(d)})`);
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
        .on('click', _onClick);
    g.append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text(d => d);

    // Add and store a brush for each axis.
    g.append('g')
        .attr('class', 'brush')
        .call(d3.brushY().on('brush end', brush));

    // Color _dimensions by z-score
    _onClick(_dimensions[0]);
  }

  /**
   * @name render
   * @instance
   * @method
   * @return {parallelCoordinatesChart}
   */
  _chart.render = function render() {
    this.call();
    return _chart;
  };

  /**
   * @name redraw
   * @instance
   * @method
   * @return {parallelCoordinatesChart}
   */
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
    Object.keys(_yAccessors).forEach((k) => {
      const extent = d3.extent(_data.map(d => d[k]));
      if (extent[0] === extent[1]) {
        extent[0] -= extent[0] / 2;
        extent[1] += extent[1] / 2;
      }
      _y[k].domain(extent);
    });

    // Transition axes
    _svg.selectAll('.axis')
        .each(function transitionAxis(d) {
          transition(d3.select(this)).delay(500).call(_axis.scale(_y[d]));
        });

    // Rebind data
    _background = _svg.select('.background')
        .selectAll('path')
        .data(_data);
    _foreground = _svg.select('.foreground')
        .selectAll('path')
        .data(_data);
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

    // Fade in lines
    transition(_background).delay(1000)
        .style('opacity', 0.5);
    transition(_foreground).delay(1000)
        .style('opacity', 0.5);

    return _chart;
  };

  /**
   * @name width
   * @instance
   * @param {int} [val] Value to set width to
   * @return {int}
   * @return {scatterplot}
   */
  _chart.width = function width(val) {
    if (!arguments.length) { return _width; }
    _width = val;
    return _chart;
  };

  /**
   * @name height
   * @instance
   * @param {int} val
   * @return {int}
   * @return {scatterplot}
   */
  _chart.height = function height(val) {
    if (!arguments.length) { return _height; }
    _height = val;
    return _chart;
  };

  /**
   * @name margin
   * @instance
   * @param {int} val
   * @return {int}
   * @return {scatterplot}
   */
  _chart.margin = function margin(val) {
    if (!arguments.length) { return _margin; }
    _margin = val;
    return _chart;
  };

  /**
   * @name data
   * @instance
   * @param {int} val
   * @return {int}
   * @return {scatterplot}
   */
  _chart.data = function data(val) {
    if (!arguments.length) { return _data; }
    _data = val;
    return _chart;
  };

  /**
   * @name y
   * @instance
   * @param {object} y
   * @return {object}
   * @return {scatterplot}
   */
  _chart.y = function y(val) {
    if (!arguments.length) { return _y; }
    _y = val;
    return _chart;
  };

  /**
   * @name yAccessors
   * @instance
   * @param {object} yAccessors
   * @return {object}
   * @return {scatterplot}
   */
  _chart.yAccessors = function yAccessors(val) {
    if (!arguments.length) { return _yAccessors; }
    _yAccessors = val;
    return _chart;
  };

  /**
   * @name color
   * @instance
   * @param {object} color
   * @return {object}
   * @return {scatterplot}
   */
  _chart.color = function color(val) {
    if (!arguments.length) { return _color; }
    _color = val;
    return _chart;
  };

  /**
   * @name colorAccessor
   * @instance
   * @param {object} colorAccessor
   * @return {object}
   * @return {scatterplot}
   */
  _chart.colorAccessor = function colorAccessor(val) {
    if (!arguments.length) { return _colorAccessor; }
    _colorAccessor = val;
    return _chart;
  };

  /**
   * @name onClick
   * @instance
   * @param {object} onClick
   * @return {object}
   * @return {scatterplot}
   */
  _chart.onClick = function onClick(val) {
    if (!arguments.length) { return _onClick; }
    _onClick = val;
    return _chart;
  };

  return _chart;
};
