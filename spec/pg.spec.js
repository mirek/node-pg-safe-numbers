/* eslint-disable no-unused-expressions, max-len */

import { pgSetTypeParsers, pgUnsetTypeParsers } from '../lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Pg from './pg';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('pg', function () {

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

    it('should work with arrays', async function () {
      expect(await pg.value('select \'{1}\'::bigint[]')).to.deep.eq([1]);
      expect(await pg.value('select \'{1}\'::numeric[]')).to.deep.eq([1]);
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
      expect(await pg.value('select json_build_object(\'$\', 9007199254740993::bigint)')).to.deep.eq({ $: 9007199254740992 });
      expect(await pg.value('select json_build_object(\'$\', 9007199254740993::numeric)')).to.deep.eq({ $: 9007199254740992 });
    });

  });

});
