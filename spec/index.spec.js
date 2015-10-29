/* eslint-disable no-unused-expressions */

import { safeParseInt, safeParseFloat } from '../lib';
import { expect } from 'chai';

describe('safeParseInt', function () {
  it('should work', function () {
    expect(safeParseInt('')).to.be.nan;
    expect(safeParseInt('0')).to.eq(0);
    expect(safeParseInt('3')).to.eq(3);
    expect(safeParseInt(Math.pow(2, 53) - 1)).to.eq(9007199254740991);
    expect(() => safeParseInt(Math.pow(2, 53))).to.throw(TypeError);
  });
});

describe('safeParseFloat', function () {
  it('should work', function () {
    expect(safeParseFloat('')).to.be.nan;
    expect(safeParseFloat('Infinity')).to.eq(Infinity);
    expect(safeParseFloat('+Infinity')).to.eq(+Infinity);
    expect(safeParseFloat('-Infinity')).to.eq(-Infinity);
    expect(() => safeParseFloat('0.000000000001')).to.throw(TypeError);
    expect(safeParseFloat('3.45')).to.eq(3.45);
    expect(safeParseFloat('0.000')).to.eq(0);
    expect(safeParseFloat('0.100')).to.eq(0.1);
    expect(safeParseFloat('1234.5')).to.eq(1234.5);
  });
});
