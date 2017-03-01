# console-at

Add console functions that also output where the call was made.

The console object has several useful functions defined as properties. Because functions are not primitive we can add properties to those functions. For each of the following functions, an `at` property is added that is called using the same parameters. It calls the original function plus adds information about where the function was called.

These functions each have the `at` property added to them just by requiring the `console-at` package once in your project:

* console.**error**
* console.**info**
* console.**log**
* console.**warn**

**Example 1**

This still works.

```js
require('console-at');
console.log('Hello, World!');
// Hello, World!
```

**Example 2**

We can also call the log function with location information:

```js
require('console-at');
console.log.at('Hello, World!');
// Hello, World!
//   at /path/to/file.js: 2
```

## Installation

```sh
$ npm install console-at
```

## API

The package includes a single function that can be called to determine the location that the function is called at. Additionally this function can take an optional parameter that will specify how far back in the stack to look for location information.

#### at ( [ backDepth = 0 ] )

**Parameters**

* **backDepth** - *Optional*. How far back in the stack trace to get location information for. Defaults to `0`.

**Returns** an object with the following properties:

* **column** - *Number*. The column number.
* **file** - *String*. The file name.
* **line** - *Number*. The line number.
* **method** - *String*. The function name.
* **position** - *Number*. The position in the file.
* **source** - *String*. The file name and line number.

**Example 1: Zero Depth**

```js
var at = require('console-at');

function foo() {
    return at();        // the position reported is here
}

console.log(foo());

/*
{ column: 12,
  file: '/path/to/file.js',
  line: 4,
  method: 'foo',
  position: 120,
  source: '/path/to/file.js:4' }
*/
```

**Example 2: One Depth**

```js
var at = require('./index');

function foo() {
    return at(1);
}

var source = foo();     // the position reported is here
console.log(source);

/*
{ column: 14,
  file: '/path/to/file.js',
  line: 7,
  method: null,
  position: 143,
  source: '/path/to/file.js:7' }
*/
```