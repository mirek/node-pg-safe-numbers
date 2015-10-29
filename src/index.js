
import util from 'util';

/**
 * Default handler for unsafe int parser.
 * @param {Number} parsed Parsed value.
 * @param {String} text Input string.
 * @return Optional value to be returned by the parser.
 */
function defaultUnsafeInt(parsed, text) {
  throw new TypeError(`Unsafe int parse ${util.inspect(text)}) to ${util.inspect(parsed)}.`);
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
 * Compare number with it's floating point string represenation.
 * @param {Number} parsed
 * @param {String} text
 * @return {Boolean} True if the parsed number is the same as precision text representation.
 */
export function floatCompare(parsed, text) {
  let precision = (text.match(/[0-9]/g) || []).length - (Math.abs(parsed) < 1 && parsed !== 0 ? 1 : 0);
  return parsed.toPrecision(precision) === text;
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
 * Replace default pg parsers for Int8 and Numberic data types.
 * @param {pg?} .pg
 * @param {Function(parsed, text)?} unsafeInt Function handler to deal with unsafe input, default throws TypeError.
 * @param {Function(parsed, text)?} unsafeFloat Function handler to deal with unsafe input, default throws TypeError.
 */
export function pgSetTypeParsers({ pg: pg_, unsafeInt = defaultUnsafeInt, unsafeFloat = defaultUnsafeFloat } = {}) {

  const PgTypes = { Int8: 20, Numeric: 1700 };

  const pg = pg_ ? pg_ : require('pg');

  pg.types.setTypeParser(PgTypes.Int8, 'text', function (text) {
    return safeParseInt(text, unsafeInt || defaultUnsafeInt);
  });

  pg.types.setTypeParser(PgTypes.Numeric, 'text', function (text) {
    return safeParseFloat(text, unsafeFloat || defaultUnsafeFloat);
  });

}

/**
 * @see pgSetTypeParsers
 */
export default pgSetTypeParsers;
