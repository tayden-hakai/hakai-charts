/* eslint-disable func-names, no-undef, no-unused-expressions */

import { schemeCategory10, schemeCategory20 } from 'd3-scale';
import { expect } from 'chai';
import paraCoords from '../para_coords.js';

describe('Parallel Coordinates', () => {
  let chart;

  beforeEach(() => {
    chart = paraCoords();
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

  describe('y', () => {
    it('should set and get y scales correctly', () => {
      const y = { x: () => 1, y: () => 2 };
      chart.y(y);
      expect(chart.y()).to.deep.equal(y);
    });
  });

  xdescribe('yAccessors', () => {
    it('should set and get yAccessor functions correctly', () => {
      const yAccessors = { a1: d => d.a, a2: d => d.b };
      chart.yAccessors(yAccessors);
      expect(chart.yAccessors()).to.deep.equal(yAccessors);
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

  describe('onClick', () => {
    it('should default to a function that does nothing', () => {
      expect(chart.onClick()()).to.deep.equal();
    });
    it('should set and get an axis onClick function correctly', () => {
      const onClick = dim => dim.substring(5);
      chart.onClick(onClick);
      expect(chart.onClick()).to.deep.equal(onClick);
    });
  });
});
