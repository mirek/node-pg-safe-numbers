/* eslint-disable no-unused-expressions, max-len */

import { safeParseInt, safeParseFloat, pgSetTypeParsers, pgUnsetTypeParsers } from '../lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Pg from './pg';

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
    expect(safeParseFloat('0.050')).to.eq(0.05);
    expect(safeParseFloat('0.550')).to.eq(0.55);
    expect(safeParseFloat('0.0500')).to.eq(0.05);
    expect(safeParseFloat('0.5500')).to.eq(0.55);
    expect(safeParseFloat('0.000')).to.eq(0);
    expect(safeParseFloat('0.100')).to.eq(0.1);
    expect(safeParseFloat('1234.5')).to.eq(1234.5);
  });
});

describe('Sequelize', function () {

  let pg = null;

  beforeEach(async function () {
    pg = await new Pg().connect('postgres://localhost/test');
  });

  afterEach(async function () {
    pg.disconnect();
  });

  it('should not work yet', async function () {
    expect(await pg.value('select 1::bigint')).to.eq('1');
    expect(await pg.value('select 9007199254740992::bigint')).to.eq('9007199254740992');
    expect(await pg.value('select 9007199254740993::numeric')).to.eq('9007199254740993');
    expect(await pg.value('select 1234.5::numeric')).to.eq('1234.5');
  });

  describe('as text', async function () {

    before(function () {
      pgSetTypeParsers({ unsafeInt: (parsed, text) => text, unsafeFloat: (parsed, text) => text });
    });

    after(function () {
      pgUnsetTypeParsers();
    });

    it('should return original text for unsafe', async function () {
      expect(await pg.value('select 1::bigint')).to.eq(1);
      expect(await pg.value('select 1234.5::numeric')).to.eq(1234.5);
      expect(await pg.value('select 9007199254740992::bigint')).to.eq('9007199254740992');
      expect(await pg.value('select 1234.5::numeric')).to.eq(1234.5);
      expect(await pg.value('select 9007199254740993::numeric')).to.eq('9007199254740993');
    });

  });

  describe('as parsed', async function () {

    before(function () {
      pgSetTypeParsers({ unsafeInt: parsed => parsed, unsafeFloat: parsed => parsed });
    });

    after(function () {
      pgUnsetTypeParsers();
    });

    it('should return unsafe parsed value', async function () {
      expect(await pg.value('select 1::bigint')).to.eq(1);
      expect(await pg.value('select 1234.5::numeric')).to.eq(1234.5);
      expect(await pg.value('select 9007199254740992::bigint')).to.eq(9007199254740992);
      expect(await pg.value('select 0.00000000000000000001::numeric')).to.eq(0.00000000000000000001);
    });

    it('should be broken and silent about it', async function () {
      expect(await pg.value('select 9007199254740993::bigint')).to.eq(9007199254740992);
      expect(await pg.value('select 9007199254740993::numeric')).to.eq(9007199254740992);
      expect(await pg.value(`select json_build_object('$', 9007199254740993::bigint)`)).to.deep.eq({ $: 9007199254740992 });
      expect(await pg.value(`select json_build_object('$', 9007199254740993::numeric)`)).to.deep.eq({ $: 9007199254740992 });
    });

  });

});
