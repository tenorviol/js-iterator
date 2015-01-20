
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
          return cb(null, f(item));
        }
      });
    }

    function nextCallback(cb) {
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
      return new Iterator(next);
    } else {
      return new Iterator(nextCallback);
    }
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
