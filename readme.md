js-iterator
===========

download
--------

TODO: npm


quick start
-----------

Require js-iterator. TODO: npm

```js
var Iterator = require('js-iterator');
```

On creation,
iterators take a `next` function
in node callback style.
To get the next value from the iterator,
call its `next` method.

```js
// cb(err, item)
function nextRandom(cb) {
    cb(null, Math.random());
}

var it = new Iterator(nextRandom);

it.next(function (err, item) {
  console.log(item);
});
```
```js
0.13976101111620665
```

The random iterator is infinite,
so conversion to an array would take forever.
But we can constrain the length using `take`
and then get an array of the finite sequence using `toArray`.

```js
it.take(5).toArray(function (err, result) {
  console.log(result);
});
```
```js
[ 0.8878921919967979,
  0.8639499587006867,
  0.8767323752399534,
  0.7335713140200824,
  0.9920800605323166 ]
```

To convert the random real sequence [0,1)
into a random integer sequence [1,6]
use the `map` method.

```js
var d6 = it.map(function (x) {
  return Math.floor(x * 6) + 1;
});

d6.take(4).toArray(function (err, result) {
  console.log(result);
});
```
```js
[ 6, 1, 4, 1 ]
```

To keep track of how many times we rolled the d6,
use the `zipWithIndex` method.

```js
d6.take(4).zipWithIndex().toArray(function (err, result) {
  console.log(result);
});
```
```js
[ [ 6, 0 ],
  [ 6, 1 ],
  [ 4, 2 ],
  [ 2, 3 ] ]
```


design
------

### motivation: Why build this?

There are many libraries that look similar to this one.
There are the reactive projects,
[Kefir.js](https://pozadi.github.io/kefir/),
[RxJS](http://reactive-extensions.github.io/RxJS/)
and [Bacon.js](https://github.com/baconjs/bacon.js),
which look promising for event processing.
There are monads in Javascript,
[monet.js](https://cwmyers.github.io/monet.js/).
There is the ever popular async library and its siblings:
[Async.js](https://github.com/caolan/async),
[Step](https://github.com/creationix/step).
There are [jQuery](http://jquery.com/)
and [Underscore](http://underscorejs.org/),
both of which support maps and filters and such.
There are [node streams](http://nodejs.org/api/stream.html)
and [mongoose streams](http://mongoosejs.com/docs/api.html#querystream_QueryStream)
If I have missed some project worth mention here,
please let me know.

But none of these actually support my main use case,
which is to make it super simple setup affected data sources.
E.g.

    Source
      .findIterator(query)
      .filter(triageTooComplicatedForQuery)
      .map(removePrivateData)
      .map(proprietaryMangling)
      .take(27)
      .toArray(standardResult(res));

### goals

1. Provide a callback-based iterator pattern.
2. Generators: `next`, `forEach`, `toArray`.
3. Chainable modifiers: `filter`, `fold`, `map`, `take`, `zip`.
4. Consolidated error handling, the first error gets returned.
