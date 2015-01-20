var should = require('should');

var Iterator = require('../index');

describe('Iterator', function () {

  describe('toArray', function () {

    it('calls back an array containing all iterated results', function (done) {
      Iterator
        .range(0, 5)
        .toArray(function (err, result) {
          result.should.eql([0, 1, 2, 3, 4]);
          done();
        });
    });

    it('does not overflow the stack even on very large sets', function (done) {
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

  });

  describe('filter', function () {

    it('removes values deemed unworthy via function', function (done) {
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

    it('does not overflow the stack on very large sequences', function (done) {
      Iterator
        .range(0, 54321)
        .filter(function (x) { return false; })
        .toArray(function (err, result) {
          result.should.eql([]);
          done();
        });
    });

    it('can use a callback function', function (done) {
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

    it('can use a callback without overflowing the stack', function (done) {
      Iterator
        .range(0, 54321)
        .filter(function (x, cb) { cb(null, false); })
        .toArray(function (err, result) {
          result.should.eql([]);
          done();
        });
    });

  });

  describe('map', function () {

    it('modifies all values as iterated', function (done) {
      Iterator
        .range(0, 10)
        .map(function (x) {
          return x * 2;
        }).toArray(function (err, result) {
          result.should.eql([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
          done();
        });
    });

    it('can use a callback function', function (done) {
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

  describe('take', function () {

    it('limits the number of iterator results', function (done) {
      Iterator
        .range(0, 10)
        .take(5)
        .toArray(function (err, result) {
          result.should.eql([0, 1, 2, 3, 4]);
          done();
        });
    });

  });


  describe('zip', function () {

    it('combines two iterators', function (done) {
      Iterator
        .range(3, 7)
        .zip(Iterator.range(2, 6))
        .toArray(function (err, result) {
          result.should.eql([[3,2], [4,3], [5,4], [6,5]]);
          done();
        })
    });

    it('terminates when the first iterator runs out of results', function (done) {
      Iterator
        .range(2, 6)
        .zip(Iterator.range(0, 10))
        .toArray(function (err, result) {
          result.should.eql([[2,0], [3,1], [4,2], [5,3]]);
          done();
        })
    });

    it('terminates when the second iterator runs out of results', function (done) {
      Iterator
        .range(0, 10)
        .zip(Iterator.range(2, 6))
        .toArray(function (err, result) {
          result.should.eql([[0,2], [1,3], [2,4], [3,5]]);
          done();
        })
    });

  });


  describe('Iterator.range(start, end [, step])', function() {

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

  });

});
