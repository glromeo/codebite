![logo](https://github.com/glromeo/codebite/blob/main/tiny-node-logger/logo.svg)

A small and fast **node.js** library to look at a log that doesn't hurt the eyes!
##### Main Features
* The usual levels: `trace`, `debug`, `info`, `warn` & `error`
* `Syntax coloring` (simple and intuitive)
* Log call site details: `filename`, `line number` and `column`
* Can be used as `function calls` or `tagged templates`


### Install
```bash
npm i @codebite/logger
```

### Usage
One can log using function calls
```javascript
const log = require("tiny-node-logger");

log("Hello world!")
```
or tagged templates
```javascript
log`Hello world!`
```
In both cases instead of a generic log one can use a specific level
```javascript
const {trace, debug, info, warn, error, setLevel} = require("tiny-node-logger");

setLevel("trace"); // otherwise defaults to "info"

trace`Hello world!`
debug`Hello world!`
info`Hello world!`
warn`Hello world!`
error`Hello world!`
```
produces the following output (indicatively):

![colored log output](https://github.com/glromeo/codebite/blob/master/logger/images/example-plain.png?raw=true)

### Details
The following example enables the details and uses method calls as an alternative to function calls
```javascript
  1 |  const log = require("tiny-node-logger");
  2 |  
  3 |  log.level = "trace";
  4 |  
  5 |  log.details = true;
  6 |  
  7 |  log.trace("Hello world!");
  8 |  log.debug("Hello world!");
  9 |  log.info("Hello world!");
 10 |  log.warn("Hello world!");
 11 |  log.error("Hello world!");
```
producing an output similar to this:

![colored log output](https://github.com/glromeo/codebite/blob/master/logger/images/example-with-details.png?raw=true)

### Benchmarks
```
console.log x 1,494 ops/sec ±0.91% (81 runs sampled)
simple x 1,426 ops/sec ±1.01% (88 runs sampled)
tagged templates x 1,487 ops/sec ±1.22% (86 runs sampled)
detailed x 1,362 ops/sec ±0.83% (84 runs sampled)
detailed tagged templates x 1,420 ops/sec ±0.85% (86 runs sampled)
```
Oddly, it seems that tagged templates are faster ...but not by much.
> The log library is practically as fast as console.log and the impact of enabling the details negligible in comparison to the cost of the write operations

#### References

* Coloured thanks to: [https://github.com/chalk/chalk](https://github.com/chalk/chalk)
* Logo created using: [https://maketext.io](https://maketext.io)
* Details extracted using: [https://v8.dev/docs/stack-trace-api](https://v8.dev/docs/stack-trace-api)
