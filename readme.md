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

The random iterator is infinite,
so conversion to an array would take forever.
But we can constrain the length using `take`
and then get an array of the finite sequence using `toArray`.

```js
it.take(5).toArray(function (err, result) {
  console.log(result);
});
```

To convert the random real sequence [0,1)
into a random integer sequence [1,6]
use the `map` method.

```js
var d6 = it.map(function (x) {
  return Math.floor(x * 6) + 1;
});

d6.take(10).toArray(function (err, result) {
  console.log(result);
});
```

To keep track of how many times we rolled the d6,
use the `zipWithIndex` method.

```js
d6.take(10).zipWithIndex().toArray(function (err, result) {
  console.log(result);
});
```
