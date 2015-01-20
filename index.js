
// next(cb(err, item))
function Iterator(next) {
  this.next = next;
}

Iterator.maxStack = 500;

Iterator.prototype = {
  /**
   * Exercise the iterator until `undefined`,
   * returning all results as a single array.
   *
   * cb(err, result)
   */
  toArray: function (cb) {
    var self = this;
    var result = [];
    function iterate() {
      self.next(function (err, item) {
        if (err) return cb(err);
        if (item === undefined) {
          // This helps with really long pointless stack traces
          // by resetting the stack.
          return setTimeout(function () {
            cb(null, result);
          }, 0);
        } else {
          result.push(item);
          if (result.length % Iterator.maxStack === 0) {
            // This helps with stack overflow by resetting the stack.
            // We do it intermittently because it's slooooowwwwwww.
            return setTimeout(iterate, 0);
          } else {
            return iterate();
          }
        }
      });
    }
    iterate();
  },

  // f(x): y
  // f(x, cb(err, y))
  map: function (f) {
    var self = this;

    function next(cb) {
      self.next(function (err, item) {
        if (err) {
          cb(err);
        } else if (item === undefined) {
          cb();
        } else {
          cb(null, f(item));
        }
      });
    }

    function nextCallback(cb) {
      self.next(function (err, item) {
        if (err) {
          cb(err);
        } else if (item === undefined) {
          cb();
        } else {
          f(item, cb);
        }
      });
    }

    if (f.length === 1) {
      return new Iterator(next);
    } else {
      return new Iterator(nextCallback);
    }
  },

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

Iterator.range = function (start, end, step) {
  step = step || 1;
  var current = start;
  function next(cb) {
    if (current < end) {
      var result = current;
      current += step;
      cb(null, result);
    } else {
      cb();
    }
  }

  return new Iterator(next);
};

module.exports = Iterator;
