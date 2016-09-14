// Load stylesheet
require('../styles/vertical_line.scss');

import * as d3 from 'd3';

function verticalLine(parent) {
  let _svg;
  let _focus;
  let _context;
  let _x;
  let _x2;
  let _y;
  let _y2;
  let _xAxis;
  let _yAxis;
  let _yAxis2;
  let _margin;
  let _margin2;
  let _width;
  let _height;
  let _brush;
  let _data;
  let _keyAccessor;
  let _valueAccessor;
  let _xAccessor = d => d.x;
  let _yAccessor = d => d.y;
  let _xLabel;
  let _yLabel;

  function drawLine(x, y) {
    return d3.line()
      .curve(d3.curveCatmullRom)
      .x(d => x(_xAccessor(d)))
      .y(d => y(_yAccessor(d)));
  }

  function brushed() {
    if (!d3.event.sourceEvent) return; // only transition after input

    const selection = d3.event.selection;
    if (!selection) _y.domain(d3.extent(_data, _yAccessor));
    else _y.domain(selection.reverse().map(_y2.invert));

    _focus.select('.line').transition()
        .attr('d', drawLine(_x, _y));
    _focus.select('.y.axis')
      .transition().call(_yAxis);
  }

  function _chart() {
    const width = _width - _margin.left - _margin.right;
    const width2 = _width - _margin2.left - _margin2.right;
    const height = _height - _margin.top - _margin.bottom;

    _x = d3.scaleLinear().range([0, width]).domain(d3.extent(_data, _xAccessor));
    _x2 = d3.scaleLinear().range([0, width2]).domain(d3.extent(_data, _xAccessor));

    _y = d3.scaleLinear().range([height, 0]).domain(d3.extent(_data, _yAccessor));
    _y2 = d3.scaleLinear().range([height, 0]).domain(d3.extent(_data, _yAccessor));

    _xAxis = d3.axisBottom().scale(_x);
    _yAxis = d3.axisLeft().scale(_y);
    _yAxis2 = d3.axisLeft().scale(_y2);

    _brush = d3.brushY()
      .extent([[0, 0], [width + width2, height]])
      .on('start brush end', brushed);

    _svg = d3.select(parent).append('svg')
        .attr('width', width + _margin.left + _margin.right)
        .attr('height', height + _margin.top + _margin.bottom);

    _svg.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    _focus = _svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${_margin.left}, ${_margin.top})`);

    _context = _svg.append('g')
        .attr('class', 'context')
        .attr('transform', `translate(${_margin2.left}, ${_margin2.top})`);

    // xAxis
    _focus.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(_xAxis);

    // yAxis
    _focus.append('g')
        .attr('class', 'y axis')
        .call(_yAxis);

    _context.append('g')
        .attr('class', 'y axis')
        .call(_yAxis2);

    // axis labels
    _svg.append('text')
      .attr('class', 'y label')
      .attr('text-anchor', 'end')
      .attr('y', 6)
      .attr('dy', '.75em')
      .attr('transform', `translate(0, ${_margin.top}) rotate(-90)`)
      .text(_yLabel);

    _svg.append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'end')
      .attr('y', 6)
      .attr('dy', '.75em')
      .attr('transform', `translate(${width + _margin.left}, ${height + _margin.bottom})`)
      .text(_xLabel);

    // line
    _focus.append('path')
        .datum(_data)
        .attr('class', 'line')
        .attr('d', drawLine(_x, _y));

    _context.append('path')
        .datum(_data)
        .attr('class', 'line')
        .attr('d', drawLine(_x2, _y2));

    // brush
    _context.append('g')
      .attr('class', 'y brush')
      .call(_brush)
    .selectAll('rect')
      .attr('x', -6)
      .attr('width', width2 + 7);

    // rollover
    const tooltip = _focus.append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');

    tooltip.append('circle')
        .attr('r', 4.5);

    tooltip.append('text')
        .attr('x', 9)
        .attr('dy', '.35em');

    _focus.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', () => tooltip.style('display', null))
        .on('mouseout', () => tooltip.style('display', 'none'))
        .on('mousemove', function mousemove() {
          const y0 = _y.invert(d3.mouse(this)[1]);
          const i = d3.bisector(d => _yAccessor(d)).left(_data, y0, 1, _data.length);
          const d0 = _data[i - 1];
          const d1 = _data[i];
          const d = y0 - _yAccessor(d0) > _yAccessor(d1) - y0 ? d1 : d0;

          tooltip.attr('transform', `translate(${_x(_xAccessor(d))}, ${_y(_yAccessor(d))})`);
          tooltip.select('text').text(_valueAccessor(d));
        });
  }

  _chart.redraw = () => {
    const width = _width - _margin.left - _margin.right;
    const height = _height - _margin.top - _margin.bottom;
    const focusline = _focus.select('.line').datum(_data);
    const contextline = _context.select('.line').datum(_data);

    // Exit, Update, Enter logic
    _y.domain(d3.extent(_data, _yAccessor));
    _y2.domain(d3.extent(_data, _yAccessor));
    _x.domain(d3.extent(_data, _xAccessor));
    _x2.domain(d3.extent(_data, _xAccessor));

   // update axes
    _focus.select('.x.axis')
      .transition()
        .call(_xAxis);

    _focus.select('.y.axis')
      .transition()
        .call(_yAxis);

    // remove extra line
    focusline.exit().remove();
    contextline.exit().remove();

    // transform remaining line
    focusline.transition()
        .attr('d', drawLine(_x, _y));
    contextline.transition()
        .attr('d', drawLine(_x2, _y2));

    // add new line bits
    focusline.enter().append('path')
        .attr('class', 'line')
        .attr('d', drawLine(_x, _y));
    contextline.enter().append('path')
        .attr('class', 'line')
        .attr('d', drawLine(_x2, _y2));

   // update axis labels
    _svg.select('.y.label')
      .text(_yLabel);

    _svg.select('.x.label')
      .text(_xLabel);

    // clear the brush
    d3.select('.brush').call(_brush.move, null);

    return _chart;
  };

  _chart.render = function render() {
    this.call();
    return _chart;
  };

  _chart.margin = function margin(val) {
    if (!arguments.length) return _margin;
    _margin = val;
    return _chart;
  };

  _chart.margin2 = function margin2(val) {
    if (!arguments.length) return _margin2;
    _margin2 = val;
    return _chart;
  };

  _chart.width = function width(val) {
    if (!arguments.length) return _width;
    _width = val;
    return _chart;
  };

  _chart.height = function height(val) {
    if (!arguments.length) return _height;
    _height = val;
    return _chart;
  };

  _chart.data = function data(val) {
    if (!arguments.length) return _data;
    _data = val;
    return _chart;
  };

  _chart.keyAccessor = function keyAccessor(val) {
    if (!arguments.length) return _keyAccessor;
    _keyAccessor = val;
    return _chart;
  };

  _chart.valueAccessor = function valueAccessor(val) {
    if (!arguments.length) return _valueAccessor;
    _valueAccessor = val;
    return _chart;
  };

  _chart.xAccessor = function xAccessor(val) {
    if (!arguments.length) return _xAccessor;
    _xAccessor = val;
    return _chart;
  };

  _chart.yAccessor = function yAccessor(val) {
    if (!arguments.length) return _yAccessor;
    _yAccessor = val;
    return _chart;
  };

  _chart.yLabel = function yLabel(val) {
    if (!arguments.length) return _yLabel;
    _yLabel = val;
    return _chart;
  };

  _chart.xLabel = function xLabel(val) {
    if (!arguments.length) return _xLabel;
    _xLabel = val;
    return _chart;
  };

  return _chart;
}

export default verticalLine;
