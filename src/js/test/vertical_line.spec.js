/* eslint-disable func-names, no-undef */

import { expect } from 'chai';
import verticalLine from '../vertical_line.js';

describe('Vertical Line', () => {
  let chart;

  beforeEach(() => {
    chart = verticalLine();
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

  describe('margin2', () => {
    it('should set and get the chart margin correctly', () => {
      chart.margin2({ top: 1, right: 2, bottom: 3, left: 4 });
      expect(chart.margin2()).to.deep.equal({ top: 1, right: 2, bottom: 3, left: 4 });
      chart.margin2({ top: 12, right: 73, bottom: 51, left: 23 });
      expect(chart.margin2()).to.deep.equal({ top: 12, right: 73, bottom: 51, left: 23 });
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

  xdescribe('color', () => {
    it('should be have a sensible default');
    it('should set and get a color correctly');
  });

  describe('keyAccessor', () => {
    const data = { x: 1, value: 2, key: 0 };
    it('should have a sensible default', () => {
      const keyAccessor = chart.keyAccessor();
      expect(keyAccessor(data)).to.equal(0);
    });
    it('should set and get an keyAccessor correctly', () => {
      chart.keyAccessor(d => d.x);
      const keyAccessor = chart.keyAccessor();
      expect(keyAccessor(data)).to.equal(1);
    });
  });

  describe('valueAccessor', () => {
    const data = { x: 1, value: 2, key: 0 };
    it('should have a sensible default', () => {
      const valueAccessor = chart.valueAccessor();
      expect(valueAccessor(data)).to.equal(2);
    });
    it('should set and get an valueAccessor correctly', () => {
      chart.valueAccessor(d => d.x);
      const valueAccessor = chart.valueAccessor();
      expect(valueAccessor(data)).to.equal(1);
    });
  });
});
