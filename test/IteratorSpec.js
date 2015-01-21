var should = require('should');

var Iterator = require('../index');

describe('Iterator', function () {

  describe('new Iterator( next(cb(err, value)) )', function () {

    it('calls `next` on each iteration', function (done) {
      var i = 1;
      function next(cb) {
        cb(null, i++);
      }
      var it = new Iterator(next);
      it.next(function (err, value) {
        value.should.equal(1);
        it.next(function (err, value) {
          value.should.equal(2);
          done();
        })
      });
    });

  });


  describe('new Iterator( next() )', function () {

    it('converts the `next()` function to a node-style callback', function (done) {
      var i = 1;
      function next() {
        return i++;
      }
      var it = new Iterator(next);
      it.next(function (err, value) {
        value.should.equal(1);
        it.next(function (err, value) {
          value.should.equal(2);
          done();
        })
      });
    });

    it('catches thrown errors and returns them via callback', function (done) {
      var expect = new Error('expected error');
      var it = new Iterator(function () {
        throw expect;
      });
      it.next(function (err, value) {
        should(err).equal(expect);
        done();
      });
    });

  });


  describe('it.toArray( cb(err, result) )', function () {

    it('calls back an array containing all iterated results', function (done) {
      Iterator
        .range(0, 5)
        .toArray(function (err, result) {
          result.should.eql([0, 1, 2, 3, 4]);
          done();
        });
    });

    it('does not overflow the stack on large sequences', function (done) {
      var size = 54321;
      Iterator
        .range(0, size)
        .toArray(function (err, result) {
          result.length.should.eql(size);
          result.every(function (x, index) {
            return x === index;
          });
          done();
        });
    });

    it('returns the first error encountered', function (done) {
      var expect = new Error("expected error");
      Iterator
        .range(0, 10)
        .map(function (x, cb) {
          if (x === 5) {
            cb(expect);
          } else {
            cb(null, x);
          }
        })
        .toArray(function (err, result) {
          err.should.equal(expect);
          should(result).equal(undefined);
          done();
        });
    });

  });


  describe('it.filter( f(x): boolean )', function () {

    it('removes values when !f(x)', function (done) {
      Iterator
        .range(1, 10)
        .filter(function (x) {
          return 0 !== x % 3
        })
        .toArray(function (err, result) {
          result.should.eql([1, 2, 4, 5, 7, 8]);
          done();
        });
    });

    it('does not overflow the stack on large sequences', function (done) {
      Iterator
        .range(0, 54321)
        .filter(function (x) { return false; })
        .toArray(function (err, result) {
          result.should.eql([]);
          done();
        });
    });

    it('returns the first error encountered', function (done) {
      var expect = new Error("expected error");
      Iterator
        .range(0, 10)
        .map(function (x, cb) {
          if (x === 5) {
            cb(expect);
          } else {
            cb(null, x);
          }
        })
        .filter(function (x) {
          return 0 !== (x % 2);
        })
        .toArray(function (err, result) {
          err.should.equal(expect);
          should(result).equal(undefined);
          done();
        });
    });

    it('catches thrown errors and returns them via callback', function (done) {
      var expect = new Error('expected error');
      Iterator
        .range(0, 10)
        .filter(function (x) {
          throw expect;
        })
        .next(function (err, value) {
          should(err).equal(expect);
          done();
        });
    });

  });


  describe('it.filter( f(x, cb(err, keep: boolean)) )', function () {

    it('removes values when !keep', function (done) {
      Iterator
        .range(1, 10)
        .filter(function (x, cb) {
          setTimeout(function () {
            cb(null, 0 !== x % 3);
          });
        })
        .toArray(function (err, result) {
          result.should.eql([1, 2, 4, 5, 7, 8]);
          done();
        });
    });

    it('does not overflow the stack on large sequences', function (done) {
      Iterator
        .range(0, 54321)
        .filter(function (x, cb) { cb(null, false); })
        .toArray(function (err, result) {
          result.should.eql([]);
          done();
        });
    });

  });


  describe('it.forEach( f(x), cb(err) )', function () {

    it('executes `f` on every value in the sequence, without overflowing the stack', function (done) {
      var total = 0;
      var low = 1;
      var high = 54321;
      Iterator
        .range(low, high)
        .forEach(function (x) {
          total += x;
        }, function (err) {
          should(err).be.null;
          total.should.equal((high - low + 1) * (high - low) / 2)
          done();
        });
    });

  });


  describe('it.map( f(x) )', function () {

    it('applies function `f` to all values', function (done) {
      Iterator
        .range(0, 10)
        .map(function (x) {
          return x * 2;
        }).toArray(function (err, result) {
          result.should.eql([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
          done();
        });
    });

    it('returns the first error encountered', function (done) {
      var expect = new Error("expected error");
      Iterator
        .range(0, 10)
        .map(function (x, cb) {
          if (x === 5) {
            cb(expect);
          } else {
            cb(null, x);
          }
        })
        .map(function (x) {
          return x * 2;
        })
        .toArray(function (err, result) {
          err.should.equal(expect);
          should(result).equal(undefined);
          done();
        });
    });

    it('catches thrown errors and returns them via callback', function (done) {
      var expect = new Error('expected error');
      Iterator
        .range(0, 10)
        .map(function (x) {
          throw expect;
        })
        .next(function (err, value) {
          should(err).equal(expect);
          done();
        });
    });

  });


  describe('it.map( f(x, cb(err, y)) )', function () {

    it('applies function `f` to all values', function (done) {
      Iterator
        .range(0, 3)
        .map(function (x, cb) {
          setTimeout(function () {
            cb(null, x * 3);
          }, 1);
        }).toArray(function (err, result) {
          result.should.eql([0, 3, 6]);
          done();
        });
    });

  });


  describe('it.singleton()', function () {

    it('calls the next method once, and returns that result forever', function (done) {
      new Iterator(Math.random)
        .singleton()
        .take(5)
        .toArray(function (err, result) {
          var first = result[0];
          first.should.be.a.Number;
          result.forEach(function (value) {
            value.should.equal(first);
          });
          done();
        });
    });

  });


  describe('it.take(n)', function () {

    it('limits the number of iterator results', function (done) {
      Iterator
        .range(0, 10)
        .take(5)
        .toArray(function (err, result) {
          result.should.eql([0, 1, 2, 3, 4]);
          done();
        });
    });

    it('returns the first error encountered', function (done) {
      var expect = new Error("expected error");
      Iterator
        .range(0, 10)
        .map(function (x, cb) {
          if (x === 5) {
            cb(expect);
          } else {
            cb(null, x);
          }
        })
        .take(6)
        .toArray(function (err, result) {
          should(err).equal(expect);
          should(result).equal(undefined);
          done();
        });
    });

  });


  describe('it.zip( anotherIterator )', function () {

    it('combines this with that other iterator', function (done) {
      Iterator
        .range(3, 7)
        .zip(Iterator.range(2, 6))
        .toArray(function (err, result) {
          result.should.eql([[3,2], [4,3], [5,4], [6,5]]);
          done();
        })
    });

    it('terminates when this iterator runs out of results', function (done) {
      Iterator
        .range(2, 6)
        .zip(Iterator.range(0, 10))
        .toArray(function (err, result) {
          result.should.eql([[2,0], [3,1], [4,2], [5,3]]);
          done();
        })
    });

    it('terminates when that other iterator runs out of results', function (done) {
      Iterator
        .range(0, 10)
        .zip(Iterator.range(2, 6))
        .toArray(function (err, result) {
          result.should.eql([[0,2], [1,3], [2,4], [3,5]]);
          done();
        })
    });

  });


  describe('it.zipWithIndex()', function () {

    it('adds the index to the iterated results', function (done) {
      Iterator
        .range(3, 9)
        .zipWithIndex()
        .toArray(function (err, result) {
          result.should.eql([[3,0], [4,1], [5,2], [6,3], [7,4], [8,5]]);
          done();
        })
    });

  });


  describe('Iterator.range(start [, end [, step]])', function() {

    it('produces the contiguous set of numbers [start, end)', function (done) {
      Iterator
        .range(3, 7)
        .toArray(function (err, result) {
          result.should.eql([3, 4, 5, 6]);
          done();
        });
    });

    it('optionally accepts a third, increment value, argument', function (done) {
      Iterator
        .range(0, 10, 2)
        .toArray(function (err, result) {
          result.should.eql([0, 2, 4, 6, 8]);
          done();
        });
    });

    it('iterates properly even when called without break in the event loop', function (done) {
      var it = Iterator.range(20, 25);
      it.next(function (err, item1) {
        item1.should.eql(20);
        it.next(function (err, item2) {
          item2.should.eql(21);
          done();
        });
      });
    });

    it('may continue indefinitely if end is undefined', function (done) {
      Iterator
        .range(3)
        .take(5)
        .toArray(function (err, result) {
          result.should.eql([3, 4, 5, 6, 7]);
          done();
        });
    });

  });

  describe('Iterator.singleton( factory() )', function () {

    it('calls the factory method once, and returns the result forever', function (done) {
      Iterator
        .singleton(Math.random)
        .take(5)
        .toArray(function (err, result) {
          should(err).be.null;
          result.length.should.equal(5);
          var first = result[0];
          first.should.be.a.Number;
          result.forEach(function (item) {
            item.should.equal(first);
          });
          done();
        });
    });

    it('returns an error forever if the factory throws', function (done) {
      var expect = new Error('some error');
      var firstTime = true;
      var it = Iterator
        .singleton(function () {
          if (firstTime) {
            firstTime = false;
            throw expect;
          } else {
            return 'foo';
          }
        });
      it.next(function (err, value) {
        err.should.equal(expect);
        should(value).equal(undefined);
        it.next(function (err, value) {
          err.should.equal(expect);
          should(value).equal(undefined);
          done();
        });
      });
    });

  });

  describe('Iterator.singleton( factory(cb(err, value)) )', function () {

    it('calls the factory method once, and returns the result forever', function (done) {
      var expect;
      Iterator
        .singleton(function (cb) {
          expect = Math.random();
          cb(null, expect);
        })
        .take(5)
        .toArray(function (err, result) {
          should(err).be.null;
          result.length.should.equal(5);
          // all values should be the same
          result.forEach(function (item) {
            item.should.equal(expect);
          })
          done();
        })
    });

    it('returns an error forever if factory returned an error initially', function (done) {
      var expect;
      var it = Iterator
        .singleton(function (cb) {
          expect = new Error(Math.random());
          cb(expect);
        });
      it.next(function (err, result) {
        var err1 = err;
        err.should.equal(expect);
        it.next(function (err, result) {
          err.should.equal(err1);
          done();
        });
      });
    });

  });

});
