/* eslint-disable func-names, no-undef */

import * as d3 from 'd3';
import { expect } from 'chai';
import scatterplot from '../scatterplot.js';

describe('Scatterplot', function () {
  let chart;

  beforeEach(function () {
    chart = scatterplot();
  });


  describe('height', function () {
    it('should set and get the chart height correctly', function () {
      chart.height(500);
      expect(chart.height()).to.equal(500);
      chart.height(231);
      expect(chart.height()).to.equal(231);
    });
  });

  describe('width', function () {
    it('should set and get the chart width correctly', function () {
      chart.width(500);
      expect(chart.width()).to.equal(500);
      chart.width(684);
      expect(chart.width()).to.equal(684);
    });
  });

  describe('margin', function () {
    it('should set and get the chart margin correctly', function () {
      chart.margin({ top: 1, right: 2, bottom: 3, left: 4 });
      expect(chart.margin()).to.deep.equal({ top: 1, right: 2, bottom: 3, left: 4 });
      chart.margin({ top: 12, right: 73, bottom: 51, left: 23 });
      expect(chart.margin()).to.deep.equal({ top: 12, right: 73, bottom: 51, left: 23 });
    });
  });

  describe('data', function () {
    it('should set and get the chart data correctly', function () {
      chart.data([{ x: 1, y: 2 }]);
      expect(chart.data()).to.deep.equal([{ x: 1, y: 2 }]);
      chart.data([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
      expect(chart.data()).to.deep.equal([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
    });
  });

  describe('xAccessor', function () {
    const data = { x: 1, value: 2 };

    describe('default option', function () {
      it('should be sensible', function () {
        const xAccessor = chart.xAccessor();
        expect(xAccessor(data)).to.equal(1);
      });
    });
    it('should set and get an xAccessor correctly', function () {
      chart.xAccessor(function (d) { return d.value; });
      const xAccessor = chart.xAccessor();
      expect(xAccessor(data)).to.equal(2);
    });
  });

  describe('yAccessor', function () {
    const data = { y: 1, value: 2 };

    describe('default option', function () {
      it('should be sensible', function () {
        const yAccessor = chart.yAccessor();
        expect(yAccessor(data)).to.equal(1);
      });
    });
    it('should set and get an yAccessor correctly', function () {
      chart.yAccessor(function (d) { return d.value; });
      const yAccessor = chart.yAccessor();
      expect(yAccessor(data)).to.equal(2);
    });
  });

  describe('xLabel', function () {
    it('should set and get an xLabel correctly', function () {
      chart.xLabel('Some x string');
      expect(chart.xLabel()).to.equal('Some x string');
    });
  });

  describe('yLabel', function () {
    it('should set and get an yLabel correctly', function () {
      chart.yLabel('Some x string');
      expect(chart.yLabel()).to.equal('Some x string');
    });
  });

  describe('xLog', function () {
    it('should default to false', function () {
      expect(chart.xLog()).to.be.false;
    });
    it('should set and get a value correctly', function () {
      chart.xLog(true);
      expect(chart.xLog()).to.be.true;
      chart.xLog(false);
      expect(chart.xLog()).to.be.false;
    });
  });

  describe('yLog', function () {
    it('should default to false', function () {
      expect(chart.yLog()).to.be.false;
    });
    it('should set and get a value correctly', function () {
      chart.yLog(true);
      expect(chart.yLog()).to.be.true;
      chart.yLog(false);
      expect(chart.yLog()).to.be.false;
    });
  });

  describe('color', function () {
    it('should be have a sensible default', function () {
      expect(chart.color()).to.deep.equal(d3.schemeCategory10);
    });

    it('should set and get a color scale correctly', function () {
      chart.color(d3.schemeCategory20);
      expect(chart.color()).to.deep.equal(d3.schemeCategory20);
    });
  });

  describe('colorAccessor', function () {
    it('should default to 0', function () {
      expect(chart.colorAccessor()(10)).to.equal(0);
      expect(chart.colorAccessor()(1231)).to.equal(0);
      expect(chart.colorAccessor()()).to.equal(0);
    });
    it('should set and get a colorAccessor correctly', function () {
      chart.colorAccessor(function (d) { return d.color; });
      const data = { x: 1, y: 2, color: 54 };
      expect(chart.colorAccessor()(data)).to.equal(54);
    });
  });

  xdescribe('keyAccessor', function () {
    it('should have a sensible default');
    it('should set and get a keyAccessor correctly');
  });

  xdescribe('radius', function () {
    it('should have a sensible default');
    it('should set and get a radius correctly');
  });

  xdescribe('rSquared', function () {
    it('should return the correct rSquared value');
  });

  xdescribe('correlation', function () {
    it('should return the correct correlation value');
  });

  xdescribe('covariance', function () {
    it('should return the correct covariance value');
  });
});
