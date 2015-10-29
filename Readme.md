
## Summary

Safe number parsers for pg/sequelize. When unsafe parsing is detected, decision to handle this case is delegated to the
caller. Default action is to throw `TypeError` exception. You can use your handlers to return parsed value, original
string value, null etc.

## Example

`setup-pg-safe-numbers.js`:

    import util from 'util';
    import { pgSetTypeParsers } from 'pg-safe-numbers';

    function stack() {
      return new Error().stack;
    }

    let once = false;

    // Invoke only once.
    if (!once) {

      // Setup parsers for unsafe numbers.
      pgSetTypeParsers({

        // Handle unsafe integers, ie. >= Math.pow(2, 53)
        unsafeInt(parsed, text) {
          console.error(`Unsafe int ${util.inspect(text)}) parse to ${util.inspect(parsed)}.\n${stack()}`);
          return parsed;
        },

        // Handle unsafe floats.
        unsafeFloat(parsed, text) {
          console.error(`Unsafe float ${util.inspect(text)}) parse to ${util.inspect(parsed)}.\n${stack()}`);
          return parsed;
        }

      });

      once = true;
    }

`my.js`:

    require('./setup-pg-safe-numbers'); // NOTE: Doesn't really need to be before importing sequelize.
    import Sequelize from 'sequelize';
    ...

## License

MIT
