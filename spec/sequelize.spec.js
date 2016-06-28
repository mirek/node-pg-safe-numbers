/* eslint-disable no-unused-expressions, max-len */

import { pgSetTypeParsers, pgUnsetTypeParsers } from '../lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Sequelize from 'sequelize';
import _ from 'lodash';

chai.use(chaiAsPromised);
const { expect } = chai;

async function getDb() {

  const db = new Sequelize('postgres://localhost/test', { logging: null });

  db.rows = async function rows(sql, originalOptions = {}) {
    const options = _.assign({}, originalOptions, { type: 'SELECT' });
    return await this.query(sql, options);
  };

  db.row = async function (sql, options = {}) {
    const r = await this.rows(sql, options);
    return _.isArray(r) ? _.first(r) : null;
  };

  db.value = async function (sql, options = {}) {
    const r = await this.row(sql, options);
    return _.isObject(r) && _.keys(r).length === 1 ? _.first(_.values(r)) : null;
  };

  return db;
}

describe('Sequelize', function () {

  let db = null;

  describe('normal', async function () {

    before(async function () {
      db = await getDb();
    });

    after(function () {
      db.close();
      db = null;
    });

    it('should not work yet', async function () {
      expect(await db.value('select 1::bigint')).to.eq('1');
      expect(await db.value('select 9007199254740992::bigint')).to.eq('9007199254740992');
      expect(await db.value('select 9007199254740993::numeric')).to.eq('9007199254740993');
      expect(await db.value('select 1234.5::numeric')).to.eq('1234.5');
      expect(await db.value('select \'{1}\'::bigint[]')).to.deep.eq(['1']);
    });

  });

  describe('as text', async function () {

    before(async function () {
      pgSetTypeParsers({ unsafeInt: (parsed, text) => text, unsafeFloat: (parsed, text) => text });
      db = await getDb();
    });

    after(function () {
      db.close();
      db = null;
      pgUnsetTypeParsers();
    });

    it('should return original text for unsafe', async function () {
      expect(await db.value('select 1::bigint')).to.eq(1);
      expect(await db.value('select 1234.5::numeric')).to.eq(1234.5);
      expect(await db.value('select 9007199254740992::bigint')).to.eq('9007199254740992');
      expect(await db.value('select 1234.5::numeric')).to.eq(1234.5);
      expect(await db.value('select 9007199254740993::numeric')).to.eq('9007199254740993');
      expect(await db.value('select \'{1}\'::bigint[]')).to.deep.eq([1]);
    });

  });

  describe('as parsed', async function () {

    before(async function () {
      pgSetTypeParsers({ unsafeInt: parsed => parsed, unsafeFloat: parsed => parsed });
      db = await getDb();
    });

    after(function () {
      db.close();
      db = null;
      pgUnsetTypeParsers();
    });

    it('should return unsafe parsed value', async function () {
      expect(await db.value('select 1::bigint')).to.eq(1);
      expect(await db.value('select 1234.5::numeric')).to.eq(1234.5);
      expect(await db.value('select 9007199254740992::bigint')).to.eq(9007199254740992);
      expect(await db.value('select 0.00000000000000000001::numeric')).to.eq(0.00000000000000000001);
    });

    it('should be broken and silent about it', async function () {
      expect(await db.value('select 9007199254740993::bigint')).to.eq(9007199254740992);
      expect(await db.value('select 9007199254740993::numeric')).to.eq(9007199254740992);
      expect(await db.value('select json_build_object(\'$\', 9007199254740993::bigint)')).to.deep.eq({ $: 9007199254740992 });
      expect(await db.value('select json_build_object(\'$\', 9007199254740993::numeric)')).to.deep.eq({ $: 9007199254740992 });
    });

  });

});
