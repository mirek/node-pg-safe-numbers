
import util from 'util';

/**
 * Default handler for unsafe int parser.
 * @param {Number} parsed Parsed value.
 * @param {String} text Input string.
 * @return Optional value to be returned by the parser.
 */
function defaultUnsafeInt(parsed, text) {
  throw new TypeError(`Unsafe int parse ${util.inspect(text)} to ${util.inspect(parsed)}.`);
}

/**
 * Default handler for unsafe float parser.
 * @param {Number} parsed Parsed value.
 * @param {String} text Input string.
 * @return Optional value to be returned by the parser.
 */
function defaultUnsafeFloat(parsed, text) {
  throw new TypeError(`Unsafe float parse ${util.inspect(text)} to ${util.inspect(parsed)}.`);
}

/**
 * Parse integer delegating unsafe input to the handler.
 * @param {String} text
 * @param {Function} unsafeHandler = defaultUnsafeInt
 * @return {Number|NaN} Parsed value or unsafe handler's result.
 */
export function safeParseInt(text, unsafeHandler = defaultUnsafeInt) {
  const parsed = parseInt(text, 10);
  if (Number.isSafeInteger(parsed) || isNaN(parsed)) {
    return parsed;
  }
  return unsafeHandler(parsed, text);
}

/**
 * Trim float (currently on the right only).
 * @param {string} text Float string.
 * @return {string}
 */
export function floatTrim(text) {
  if (text.indexOf('.') !== -1) {
    return text.replace(/[0\s\uFEFF\xA0]+$/g, '');
  }
  return text;
}

/**
 * Compare number with it's floating point string represenation.
 * @param {Number} parsed
 * @param {String} text
 * @return {Boolean} True if the parsed number is the same as precision text representation.
 */
export function floatCompare(parsed, text) {
  let precision = (text.match(/[0-9]/g) || []).length;
  return floatTrim(parsed.toPrecision(precision)) === floatTrim(text);
}

/**
* Parse float delegating unsafe input to the handler.
* @param {String} text
* @param {Function} unsafeHandler = defaultUnsafeFloat
* @return {Number|NaN|+/-Infinity} Parsed value or unsafe handler's result.
 */
export function safeParseFloat(text, unsafeHandler = defaultUnsafeFloat) {
  let parsed = parseFloat(text);
  if (floatCompare(parsed, text) || isNaN(parsed) || !isFinite(parsed)) {
    return parsed;
  }
  return unsafeHandler(parsed, text);
}

/**
 * Remember old parsers so they can be unset.
 * @type {Array}
 */
let pgSetTypeParsersStack = [];

/**
 * Replace default pg parsers for Int8 and Numberic data types.
 * @param {pg?} .pg
 * @param {function(parsed, text)?} unsafeInt Function handler to deal with unsafe input, default throws TypeError.
 * @param {function(parsed, text)?} unsafeFloat Function handler to deal with unsafe input, default throws TypeError.
 * @return {array} Previous parsers.
 */
export function pgSetTypeParsers({ pg: pg_, unsafeInt = defaultUnsafeInt, unsafeFloat = defaultUnsafeFloat } = {}) {

  let result = [];

  const PgTypes = { Int8: 20, Numeric: 1700 };

  const pg = pg_ ? pg_ : require('pg');

  result.push({
    oid: PgTypes.Int8,
    format: 'text',
    func: pg.types.getTypeParser(PgTypes.Int8, 'text')
  });

  pg.types.setTypeParser(PgTypes.Int8, 'text', function (text) {
    return safeParseInt(text, unsafeInt);
  });

  result.push({
    oid: PgTypes.Numeric,
    format: 'text',
    func: pg.types.getTypeParser(PgTypes.Numeric, 'text')
  });

  pg.types.setTypeParser(PgTypes.Numeric, 'text', function (text) {
    return safeParseFloat(text, unsafeFloat);
  });

  pgSetTypeParsersStack.push(result);

  return result;
}

/**
 * Reverts to previously used type parsers.
 * TODO: Do it in context of pg.
 */
export function pgUnsetTypeParsers({ pg: pg_ } = {}) {
  const pg = pg_ ? pg_ : require('pg');
  const previous = pgSetTypeParsersStack.pop();
  for (let { oid, format, func } of previous) {
    pg.types.setTypeParser(oid, format, func);
  }
}

/**
 * @see pgSetTypeParsers
 */
export default pgSetTypeParsers;
