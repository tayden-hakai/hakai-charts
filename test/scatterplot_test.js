/* eslint-disable func-names, no-undef */

const d3 = require('d3');
const scatterplot = require('../src/js/scatterplot.js');

describe('Scatterplot', function () {
  let chart;

  beforeEach(function () {
    chart = scatterplot();
  });


  describe('height', function () {
    it('should set and get the chart height correctly', function () {
      chart.height(500);
      expect(chart.height()).toBe(500);
      chart.height(231);
      expect(chart.height()).toBe(231);
    });
  });

  describe('width', function () {
    it('should set and get the chart width correctly', function () {
      chart.width(500);
      expect(chart.width()).toBe(500);
      chart.width(684);
      expect(chart.width()).toBe(684);
    });
  });

  describe('margin', function () {
    it('should set and get the chart margin correctly', function () {
      chart.margin({ top: 1, right: 2, bottom: 3, left: 4 });
      expect(chart.margin()).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
      chart.margin({ top: 12, right: 73, bottom: 51, left: 23 });
      expect(chart.margin()).toEqual({ top: 12, right: 73, bottom: 51, left: 23 });
    });
  });

  describe('data', function () {
    it('should set and get the chart data correctly', function () {
      chart.data([{ x: 1, y: 2 }]);
      expect(chart.data()).toEqual([{ x: 1, y: 2 }]);
      chart.data([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
      expect(chart.data()).toEqual([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
    });
  });

  describe('xAccessor', function () {
    const data = { x: 1, value: 2 };

    describe('default option', function () {
      it('should be sensible', function () {
        const xAccessor = chart.xAccessor();
        expect(xAccessor(data)).toBe(1);
      });
    });
    it('should set and get an xAccessor correctly', function () {
      chart.xAccessor(function (d) { return d.value; });
      const xAccessor = chart.xAccessor();
      expect(xAccessor(data)).toBe(2);
    });
  });

  describe('yAccessor', function () {
    const data = { y: 1, value: 2 };

    describe('default option', function () {
      it('should be sensible', function () {
        const yAccessor = chart.yAccessor();
        expect(yAccessor(data)).toBe(1);
      });
    });
    it('should set and get an yAccessor correctly', function () {
      chart.yAccessor(function (d) { return d.value; });
      const yAccessor = chart.yAccessor();
      expect(yAccessor(data)).toBe(2);
    });
  });

  describe('xLabel', function () {
    it('should set and get an xLabel correctly', function () {
      chart.xLabel('Some x string');
      expect(chart.xLabel()).toBe('Some x string');
    });
  });

  describe('yLabel', function () {
    it('should set and get an yLabel correctly', function () {
      chart.yLabel('Some x string');
      expect(chart.yLabel()).toBe('Some x string');
    });
  });

  describe('xLog', function () {
    it('should default to false', function () {
      expect(chart.xLog()).toBe(false);
    });
    it('should set and get a value correctly', function () {
      chart.xLog(true);
      expect(chart.xLog()).toBe(true);
      chart.xLog(false);
      expect(chart.xLog()).toBe(false);
    });
  });

  describe('yLog', function () {
    it('should default to false', function () {
      expect(chart.yLog()).toBe(false);
    });
    it('should set and get a value correctly', function () {
      chart.yLog(true);
      expect(chart.yLog()).toBe(true);
      chart.yLog(false);
      expect(chart.yLog()).toBe(false);
    });
  });

  describe('color', function () {
    it('should be have a sensible default', function () {
      expect(chart.color().domain()).toEqual(d3.scale.category10().domain());
      expect(chart.color().range()).toEqual(d3.scale.category10().range());
    });

    it('should set and get a color scale correctly', function () {
      expect(chart.color(d3.scale.category20()));
      expect(chart.color().domain()).toEqual(d3.scale.category20().domain());
      expect(chart.color().range()).toEqual(d3.scale.category20().range());
    });
  });

  describe('colorAccessor', function () {
    it('should default to 0', function () {
      expect(chart.colorAccessor()(10)).toBe(0);
      expect(chart.colorAccessor()(1231)).toBe(0);
      expect(chart.colorAccessor()()).toBe(0);
    });
    it('should set and get a colorAccessor correctly', function () {
      chart.colorAccessor(function (d) { return d.color; });
      const data = { x: 1, y: 2, color: 54 };
      expect(chart.colorAccessor()(data)).toBe(54);
    });
  });

  describe('keyAccessor', function () {
    xit('should have a sensible default');
    xit('should set and get a keyAccessor correctly');
  });

  describe('radius', function () {
    xit('should have a sensible default');
    xit('should set and get a radius correctly');
  });

  describe('rSquared', function () {
    xit('should return the correct rSquared value');
  });

  describe('correlation', function () {
    xit('should return the correct correlation value');
  });

  describe('covariance', function () {
    xit('should return the correct covariance value');
  });
});
