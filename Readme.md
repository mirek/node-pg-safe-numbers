
## Summary [![Build Status](https://travis-ci.org/mirek/node-pg-safe-numbers.png?branch=master)](https://travis-ci.org/mirek/node-pg-safe-numbers)

Safe number parsers for pg/sequelize. When unsafe parsing is detected, decision to handle this case is delegated to the
caller. Default action is to throw `TypeError` exception. You can use your handlers to return parsed value, original
string value, null etc.

## Example

Setup your configuration:

    // setup-pg-safe-numbers.js

    import util from 'util';
    import { pgSetTypeParsers } from 'pg-safe-numbers';

    // Setup parsers for unsafe numbers.
    pgSetTypeParsers({

      // Handle unsafe integers, ie. >= Math.pow(2, 53)
      unsafeInt(parsed, text) {
        console.error(`Unsafe int ${util.inspect(text)}) parse to ${util.inspect(parsed)}.\n${new Error().stack}`);
        return parsed;
      },

      // Handle unsafe floats.
      unsafeFloat(parsed, text) {
        console.error(`Unsafe float ${util.inspect(text)}) parse to ${util.inspect(parsed)}.\n${new Error().stack}`);
        return parsed;
      }

    });

    // Or simply to use default TypeError throw:
    // pgSetTypeParsers();

And:

    // my.js

    require('./setup-pg-safe-numbers'); // NOTE: Doesn't really need to be before importing sequelize.
    import Sequelize from 'sequelize';
    ...

If you're not on ES6 follow https://babeljs.io/docs/usage/polyfill and you can use this library from your ES5, grampa :)

## License

MIT
