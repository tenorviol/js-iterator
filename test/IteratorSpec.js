var should = require('should');

var Iterator = require('../index');

describe('Iterator', function () {

  describe('Iterator.range(start, end [, step])', function() {

    it('produces the contiguous set of numbers [start, end)', function (done) {
      var it = Iterator.range(3, 7);
      it.toArray(function (err, result) {
        result.should.eql([3, 4, 5, 6]);
        done();
      })
    });

    it('optionally accepts a third, increment value, argument', function (done) {
      var it = Iterator.range(0, 10, 2);
      it.toArray(function (err, result) {
        result.should.eql([0, 2, 4, 6, 8]);
        done();
      })
    });

    it('iterates properly even when called without break in the event loop', function (done) {
      var it = Iterator.range(20, 25);
      it.next(function (err, item1) {
        item1.should.eql(20);
        it.next(function (err, item2) {
          item2.should.eql(21);
          done();
        })
      })
    });

  });

});
