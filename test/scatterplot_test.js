/* global describe it expect */
const d3 = require('d3');
const scatterplot = require('../src/js/scatterplot.js');

describe('Scatterplot', function() {
  describe('height', function() {
    it('should set and get the chart height correctly', function() {
      const chart = scatterplot();
      chart.height(500);
      expect(chart.height()).toBe(500);
      chart.height(231);
      expect(chart.height()).toBe(231);
    });
  });
  describe('width', function() {
    it('should set and get the chart width correctly', function() {
      const chart = scatterplot();
      chart.width(500);
      expect(chart.width()).toBe(500);
      chart.width(684);
      expect(chart.width()).toBe(684);
    });
  });
  describe('margin', function() {
    it('should set and get the chart margin correctly', function() {
      const chart = scatterplot();
      chart.margin({ top: 1, right: 2, bottom: 3, left: 4 });
      expect(chart.margin()).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
      chart.margin({ top: 12, right: 73, bottom: 51, left: 23 });
      expect(chart.margin()).toEqual({ top: 12, right: 73, bottom: 51, left: 23 });
    });
  });
  describe('data', function() {
    it('should set and get the chart data correctly', function() {
      const chart = scatterplot();
      chart.data([{ x: 1, y: 2 }]);
      expect(chart.data()).toEqual([{ x: 1, y: 2 }]);
      chart.data([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
      expect(chart.data()).toEqual([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
    });
  });


});

// TO TEST
// xAccessor
// yAccessor
// xLabel
// yLabel
// xLog
// yLog
// color
// colorAccessor
// keyAccessor
// radius
// rSquared
// correlation
// covariance
