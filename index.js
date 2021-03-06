
/**
 * Converts a function no arguments and return value,
 *
 *    f(): value
 *
 * into a congruent node-style callback function:
 *
 *    g(cb(null, f()))
 *
 * Functions with 1 or more parameters will remain unchanged.
 */
function callbackize0(f) {
  if (1 <= f.length) return f;
  function g(cb) {
    try {
      cb(null, f());
    } catch (err) {
      cb(err);
    }
  }
  return g;
}

/**
 * Converts a function with a single argument and return value,
 *
 *    f(x): value
 *
 * into a congruent node-style callback function:
 *
 *    g(x, cb(null, f(x)))
 *
 * Functions with 2 or more parameters will remain unchanged.
 */
function callbackize1(f) {
  if (2 <= f.length) return f;
  function g(x, cb) {
    try {
      cb(null, f(x))
    } catch (err) {
      cb(err);
    }
  }
  return g;
}

/**
 * All iterators have a `next` method,
 * and all are asynchronous.
 *
 *    next(): value
 *    next(cb(err, value))
 */
function Iterator(next) {
  this.next = callbackize0(next);
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

    f = callbackize1(f);
    return new Iterator(next);
  },

  /**
   *    f(x)
   *    cb(err)
   */
  forEach: function (f, cb) {
    var self = this;
    var count = 0;
    function iterate() {
      self.next(function (err, value) {
        if (err) return cb(err);
        if (undefined === value) return cb(null);
        f(value);
        count++;
        if (0 === count % Iterator.maxStack) {
          // avoid stack overflow by resetting the stack
          setTimeout(function () {
            iterate();
          }, 0);
        } else {
          iterate();
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
          return f(item, cb);
        }
      });
    }

    f = callbackize1(f);
    return new Iterator(next);
  },

  /**
   * Calls the `next` function once,
   * and returns the same result forever.
   */
  singleton: function () {
    var self = this;
    return new Iterator.singleton(function (cb) {
      self.next(cb);
    });
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
      self.next(function (err, left) {
        if (err) return cb(err);
        if (undefined === left) return cb();
        that.next(function (err, right) {
          if (err) return cb(err);
          if (undefined === right) return cb();
          return cb(null, [ left, right ]);
        })
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
    if (undefined === end || current < end) {
      var result = current;
      current += step;
      return cb(null, result);
    } else {
      return cb();
    }
  }
  return new Iterator(next);
};

/**
 * Runs the `factory` (aka `next`) function exactly once,
 * and returns the same result forever.
 */
Iterator.singleton = function (factory) {
  factory = callbackize0(factory);
  var queue = [];
  var result;
  function next(cb) {
    if (result) {
      return cb.apply({}, result);
    }
    queue.push(cb);
    // run the factory exactly once
    if (1 !== queue.length) return;
    factory(function (err, value) {
      result = arguments;
      queue.forEach(function (queuedCb) {
        queuedCb.apply({}, result);
      });
      queue = null;
    });
  }
  return new Iterator(next);
}

module.exports = Iterator;
