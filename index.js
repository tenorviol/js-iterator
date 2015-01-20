var async = require('async');

/**
 * All iterators have a `next` method,
 * and all are asynchronous.
 *
 *    next(cb(err, item))
 */
function Iterator(next) {
  this.next = next;
}

/**
 * The maximum depth to descend the stack before using `setTimeout`.
 * When working with lengthy iterators,
 * a larger value could speed the result.
 * On the other hand,
 * a large value could also cause the stack to overflow.
 * Rule of thumb:
 * Keep this value less than half of the stack size in your environment.
 */
Iterator.maxStack = 500;

Iterator.prototype = {
  /**
   * Exercise the iterator until `undefined`,
   * returning all results as a single array.
   *
   *    cb(err, result)
   */
  toArray: function (cb) {
    var self = this;
    var result = [];
    function iterate() {
      self.next(function (err, item) {
        if (err) return cb(err);
        if (undefined === item) {
          // This helps with really long pointless stack traces
          // by resetting the stack.
          return setTimeout(function () {
            cb(null, result);
          }, 0);
        } else {
          result.push(item);
          if (0 === result.length % Iterator.maxStack) {
            // This helps with stack overflow by resetting the stack.
            // It's done intermittently because it's slooooowwwwwww.
            return setTimeout(iterate, 0);
          } else {
            return iterate();
          }
        }
      });
    }
    iterate();
  },

  /**
   * Test values in the iterator,
   * removing any value that does not pass.
   * `f(true)` will leave values in the iterator.
   *
   *    f(x): boolean
   *    f(x, cb(err, boolean))
   */
  filter: function (f) {
    var self = this;
    var count = 0;

    function next(cb) {
      self.next(function (err, item) {
        if (err) return cb(err);
        if (undefined === item) {
          return cb();
        } else {
          f(item, function (err, keep) {
            if (err) return cb(err);
            if (keep) {
              return cb(null, item);
            } else {
              count++;
              if (0 === count % Iterator.maxStack) {
                // avoid stack overflow by resetting the stack
                setTimeout(function () {
                  next(cb);
                }, 0);
              } else {
                return next(cb);
              }
            }
          });
        }
      });
    }

    if (1 === f.length) {
      var originalF = f;
      f = function (x, cb) {
        cb(null, originalF(x))
      }
    }
    return new Iterator(next);
  },

  /**
   * Modify each value of the iterator,
   * using either a direct function or a callback.
   *
   *    f(x): y
   *    f(x, cb(err, y))
   */
  map: function (f) {
    var self = this;

    function next(cb) {
      self.next(function (err, item) {
        if (err) return cb(err);
        if (undefined === item) {
          return cb();
        } else {
          return f(item, cb);
        }
      });
    }

    if (1 === f.length) {
      var originalF = f;
      f = function (x, cb) {
        cb(null, originalF(x))
      }
    }
    return new Iterator(next);
  },

  reduce: function () {

  },

  /**
   * Limit the number of iterable items.
   */
  take: function (n) {
    var self = this;
    var i = 0;
    function next(cb) {
      if (i < n) {
        i++;
        return self.next(cb);
      } else {
        return cb();
      }
    }
    return new Iterator(next);
  },

  /**
   * Combines two iterables into a single Iterable.
   * The resultant Iterable's `next` function
   * will return an array of results from both iterables.
   * The array will be in order `[this.next(), that.next()]`.
   *
   *    that: Iterable
   */
  zip: function (that) {
    var self = this;
    function next(cb) {
      async.parallel([
        function (asyncCb) { self.next(asyncCb) },
        function (asyncCb) { that.next(asyncCb) }
      ], function (err, result) {
        if (err) return cb(err);
        if (undefined === result[0] || undefined === result[1]) {
          return cb();
        } else {
          return cb(null, result);
        }
      });
    }
    return new Iterator(next);
  },

  /**
   * Zip with the index number of the value.
   */
  zipWithIndex: function () {
    return this.zip(Iterator.range(0));
  }
};

/**
 * for-loop type iterator from a start value to an end value.
 */
Iterator.range = function (start, end, step) {
  step = step || 1;
  var current = start;
  function next(cb) {
    if (current < end) {
      var result = current;
      current += step;
      return cb(null, result);
    } else {
      return cb();
    }
  }
  return new Iterator(next);
};

module.exports = Iterator;
