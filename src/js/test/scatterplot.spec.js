/* eslint-disable func-names, no-undef, no-unused-expressions */

import { schemeCategory10, schemeCategory20 } from 'd3-scale';
import { expect } from 'chai';
import scatterplot from '../scatterplot.js';

describe('Scatterplot', () => {
  let chart;

  beforeEach(() => {
    chart = scatterplot();
  });


  describe('height', () => {
    it('should set and get the chart height correctly', () => {
      chart.height(500);
      expect(chart.height()).to.equal(500);
      chart.height(231);
      expect(chart.height()).to.equal(231);
    });
  });

  describe('width', () => {
    it('should set and get the chart width correctly', () => {
      chart.width(500);
      expect(chart.width()).to.equal(500);
      chart.width(684);
      expect(chart.width()).to.equal(684);
    });
  });

  describe('margin', () => {
    it('should set and get the chart margin correctly', () => {
      chart.margin({ top: 1, right: 2, bottom: 3, left: 4 });
      expect(chart.margin()).to.deep.equal({ top: 1, right: 2, bottom: 3, left: 4 });
      chart.margin({ top: 12, right: 73, bottom: 51, left: 23 });
      expect(chart.margin()).to.deep.equal({ top: 12, right: 73, bottom: 51, left: 23 });
    });
  });

  describe('data', () => {
    it('should set and get the chart data correctly', () => {
      chart.data([{ x: 1, y: 2 }]);
      expect(chart.data()).to.deep.equal([{ x: 1, y: 2 }]);
      chart.data([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
      expect(chart.data()).to.deep.equal([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 74, y: 10000 }]);
    });
  });

  describe('xAccessor', () => {
    const data = { x: 1, value: 2 };
    it('should have a sensible default', () => {
      const xAccessor = chart.xAccessor();
      expect(xAccessor(data)).to.equal(1);
    });
    it('should set and get an xAccessor correctly', () => {
      chart.xAccessor(d => d.value);
      const xAccessor = chart.xAccessor();
      expect(xAccessor(data)).to.equal(2);
    });
  });

  describe('yAccessor', () => {
    const data = { y: 1, value: 2 };
    it('should have a sensible default', () => {
      const yAccessor = chart.yAccessor();
      expect(yAccessor(data)).to.equal(1);
    });
    it('should set and get an yAccessor correctly', () => {
      chart.yAccessor(d => d.value);
      const yAccessor = chart.yAccessor();
      expect(yAccessor(data)).to.equal(2);
    });
  });

  describe('xLabel', () => {
    it('should set and get an xLabel correctly', () => {
      chart.xLabel('Some x string');
      expect(chart.xLabel()).to.equal('Some x string');
    });
  });

  describe('yLabel', () => {
    it('should set and get an yLabel correctly', () => {
      chart.yLabel('Some x string');
      expect(chart.yLabel()).to.equal('Some x string');
    });
  });

  describe('xLog', () => {
    it('should default to false', () => {
      expect(chart.xLog()).to.be.false;
    });
    it('should set and get a value correctly', () => {
      chart.xLog(true);
      expect(chart.xLog()).to.be.true;
      chart.xLog(false);
      expect(chart.xLog()).to.be.false;
    });
  });

  describe('yLog', () => {
    it('should default to false', () => {
      expect(chart.yLog()).to.be.false;
    });
    it('should set and get a value correctly', () => {
      chart.yLog(true);
      expect(chart.yLog()).to.be.true;
      chart.yLog(false);
      expect(chart.yLog()).to.be.false;
    });
  });

  describe('color', () => {
    it('should be have a sensible default', () => {
      expect(chart.color()).to.deep.equal(schemeCategory10);
    });
    it('should set and get a color scale correctly', () => {
      chart.color(schemeCategory20);
      expect(chart.color()).to.deep.equal(schemeCategory20);
    });
  });

  describe('colorAccessor', () => {
    it('should default to 0', () => {
      expect(chart.colorAccessor()(10)).to.equal(0);
      expect(chart.colorAccessor()(1231)).to.equal(0);
      expect(chart.colorAccessor()()).to.equal(0);
    });
    it('should set and get a colorAccessor correctly', () => {
      chart.colorAccessor(d => d.color);
      const data = { x: 1, y: 2, color: 54 };
      expect(chart.colorAccessor()(data)).to.equal(54);
    });
  });

  describe('keyAccessor', () => {
    const data = { x: 1, value: 2, key: 0 };
    it('should have a sensible default', () => {
      const keyAccessor = chart.keyAccessor();
      expect(keyAccessor(data)).to.equal(0);
    });
    it('should set and get an keyAccessor correctly', () => {
      chart.keyAccessor(d => d.value);
      const keyAccessor = chart.keyAccessor();
      expect(keyAccessor(data)).to.equal(2);
    });
  });

  describe('radius', () => {
    it('should default to 5', () => {
      expect(chart.radius()).to.equal(5);
    });
    it('should set and get an radius correctly', () => {
      chart.radius(20);
      expect(chart.radius()).to.equal(20);
    });
  });

  xdescribe('rSquared', () => {
    it('should return the correct rSquared value');
  });

  xdescribe('correlation', () => {
    it('should return the correct correlation value');
  });

  xdescribe('covariance', () => {
    it('should return the correct covariance value');
  });
});
