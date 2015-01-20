
// next(cb(err, item))
function Iterator(next) {
  this.next = next;
}

Iterator.prototype = {
  // cb(err, result)
  toArray: function (cb) {
    var self = this;
    var result = [];
    function iterate() {
      self.next(function (err, item) {
        if (err) {
          cb(err);
        } else if (item === undefined) {
          cb(null, result);
        } else {
          result.push(item);
          setTimeout(iterate, 0);
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
