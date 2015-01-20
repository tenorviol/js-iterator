var should = require('should');

var Iterator = require('../index');

describe('Iterator', function () {

  describe('toArray', function () {

    it('calls back an array containing all iterated results', function (done) {
      var it = Iterator.range(0, 5);
      it.toArray(function (err, result) {
        result.should.eql([0, 1, 2, 3, 4]);
        done();
      });
    });

    it('does not overflow the stack even on very large sets', function (done) {
      var size = 54321;
      var it = Iterator.range(0, size);
      it.toArray(function (err, result) {
        result.length.should.eql(size);
        result.every(function (x, index) {
          return x === index;
        })
        done();
      });
    });

  });

  describe('Iterator.range(start, end [, step])', function() {

    it('produces the contiguous set of numbers [start, end)', function (done) {
      var it = Iterator.range(3, 7);
      it.toArray(function (err, result) {
        result.should.eql([3, 4, 5, 6]);
        done();
      });
    });

    it('optionally accepts a third, increment value, argument', function (done) {
      var it = Iterator.range(0, 10, 2);
      it.toArray(function (err, result) {
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
