/* eslint-disable no-unused-expressions, max-len */

import { safeParseInt, safeParseFloat, pgSetTypeParsers } from '../lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Sequelize from 'sequelize';

chai.use(chaiAsPromised);
const { expect } = chai;

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

describe('Sequelize', function () {

  it('should not work yet', async function () {
    const sequelize = new Sequelize('postgres://localhost/test', { logging: null });
    expect(await sequelize.query('select 1::bigint foo', { type: 'SELECT' })).to.deep.eq([{ foo: '1' }]);
    expect(await sequelize.query('select 9007199254740992::bigint foo', { type: 'SELECT' })).to.deep.eq([{ foo: '9007199254740992' }]);
    expect(await sequelize.query('select 1234.5::numeric foo', { type: 'SELECT' })).to.deep.eq([{ foo: '1234.5' }]);
    sequelize.close();
  });

  it('should return original text for unsafe', async function () {
    pgSetTypeParsers({ unsafeInt: (parsed, text) => text, unsafeFloat: (parsed, text) => text });
    const sequelize = new Sequelize('postgres://localhost/test', { logging: null });
    expect(await sequelize.query('select 1::bigint foo', { type: 'SELECT' })).to.deep.eq([{ foo: 1 }]);
    expect(await sequelize.query('select 1234.5::numeric foo', { type: 'SELECT' })).to.deep.eq([{ foo: 1234.5 }]);
    expect(await sequelize.query('select 9007199254740992::bigint foo', { type: 'SELECT' })).to.deep.eq([{ foo: '9007199254740992' }]);
    expect(await sequelize.query('select 1234.5::numeric foo', { type: 'SELECT' })).to.deep.eq([{ foo: 1234.5 }]);
    sequelize.close();
  });

  it('should returned unsafe parsed value', async function () {
    pgSetTypeParsers({ unsafeInt: parsed => parsed, unsafeFloat: parsed => parsed });
    const sequelize = new Sequelize('postgres://localhost/test', { logging: null });
    expect(await sequelize.query('select 1::bigint foo', { type: 'SELECT' })).to.deep.eq([{ foo: 1 }]);
    expect(await sequelize.query('select 1234.5::numeric foo', { type: 'SELECT' })).to.deep.eq([{ foo: 1234.5 }]);
    expect(await sequelize.query('select 9007199254740992::bigint foo', { type: 'SELECT' })).to.deep.eq([{ foo: 9007199254740992 }]);
    expect(await sequelize.query('select 0.00000000000000000001::numeric foo', { type: 'SELECT' })).to.deep.eq([{ foo: 0.00000000000000000001 }]);
    sequelize.close();
  });

});
