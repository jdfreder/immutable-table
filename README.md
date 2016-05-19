# immutable-table
![Build Status](https://travis-ci.org/jdfreder/immutable-table.svg) [![codecov](https://codecov.io/gh/jdfreder/immutable-table/branch/master/graph/badge.svg)](https://codecov.io/gh/jdfreder/immutable-table)

Immutable.js powered Table data type.

immutable-table exports a `Table` class which can be used to represent a sized
two dimensional array as an Immutable.js data type.

## Installation

```
npm install --save immutable-table
```

## Usage

To import in ES6:

```js
import { Table } from 'immutable-table';
```

To import in ES5:

```js
var Table = require('immutable-table').Table;
```

To create a table you must pass a `width` and `height` to the constructor.  Here
a table of width `3` and height `4` is created:

```js
var table = new Table(3, 4);
```

By default all values of the table are `undefined`.  To set a value in the table,
use the `setCell(x, y, value)` function:

```js
table = table.setCell(0,0,'value');
```

Negative indicies can be used to index from the right or bottom.  This is true
for all index accepting methods.  Here the bottom, right cell is set to `99`:

```js
table = table.setCell(-1,-1,99);
```

Values can be any type.  Likewise, get a value using `getCell(x, y)`:

```js
console.log(table.getCell(0,0));
```

will print `value`.

You can get a range of values, as a Table, by using
`slice(startX, startY, [endX], [endY])`.  When `endX` and `endY` are not
provided, the ends of the table are used:

```js
var subTable = table.slice(1,1);
```

will return the bottom right subtable of table of size 2,3.

The width and height of a table can be read using the `width` and `height`
readonly properties:

```js
console.log(table.width, table.height);
```

will print `3 4`.

You can compare a table to another table using the `equal(otherTable)` method:

```js
console.log(table.equal(subTable));
```

will print `false`.

```js
console.log(table.equal(table));
```

will print `true`.

You can also create a table from a CSV string:

```js
var otherTable = Table.fromCSV([
  '1, 2',
  '3, 4'
].join('\n'));
```

Tables can be serialized to JSON:

```js
var text = JSON.stringify(otherTable);
```

and later deserialized using a reviver:

```js
var sameTableAsBefore = JSON.parse(text, Table.makeReviver());
```

running:

```js
sameTableAsBefore.equal(otherTable);
```

will evaluate to `true`.
