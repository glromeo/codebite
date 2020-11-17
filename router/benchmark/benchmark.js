'use strict';

const Benchmark = require('benchmark');
const Router = require('../Router');

const routes = [
  '/',
  '/user',
  '/user/:userID',
  '/user/:userID/posts',
  '/static/js/*',
  '/static/*',
  '/api/login',
  '/api/projects',
  '/api/people',
  '/api/postings',
  '/api/postings/details',
  '/api/postings/details/misc',
  '/api/postings/details/misc/many',
  '/api/postings/details/misc/many/nodes',
  '/api/postings/details/misc/many/nodes/deep',
  '/api/posts',
  '/api/posts/:postID',
  '/api/posts/:postID/comments',
  '/api/posts/:postID/comments/:commentID',
  '/medium/length/',
  '/very/very/long/long/route/route/path',
];
const testURLs = [
  '/',
  '/use',
  '/user',
  '/user/0123456789',
  '/user/0123456789012345678901234567890123456789',
  '/user/0123456789/posts',
  '/static/js/common.js',
  '/static/json/config.json',
  '/static/css/styles.css',
  '/static/',
  '/api/login',
  '/api/postings/details/misc/many/nodes/deep',
  '/api/posts/0123456789',
  '/api/posts/0123456789/comments',
  '/api/posts/0123456789/comments/0123456789',
  '/medium/length/',
  '/very/very/long/long/route/route/path',
  '/404-not-found',
  // With query string
  '/?q',
  '/use?q',
  '/user?q',
  '/user/0123456789?q',
  '/user/0123456789?querystringisreallyreallylong',
  '/static/css/styles.css?q',
  '/404-not-found?q',
];

const router = new Router();

for (const route of routes) {
  router.register(route);
}

const benchSuite = new Benchmark.Suite();

for (const url of testURLs) {
  benchSuite.add(url + ' ', () => router.find(url));
}

benchSuite.on('cycle', (event) => {
  console.log(String(event.target));
}).run();

/*

/  x 84,329,650 ops/sec ±1.75% (90 runs sampled)
/use  x 43,605,115 ops/sec ±0.86% (91 runs sampled)
/user  x 25,126,029 ops/sec ±1.58% (94 runs sampled)
/user/0123456789  x 12,191,973 ops/sec ±1.09% (92 runs sampled)
/user/0123456789012345678901234567890123456789  x 12,320,481 ops/sec ±0.61% (92 runs sampled)

a
* "C:\Program Files\nodejs\node.exe" D:\Workspace\router\benchmark\benchmark.js
/  x 81,159,584 ops/sec ±1.60% (87 runs sampled)
/use  x 43,704,146 ops/sec ±0.90% (90 runs sampled)
/user  x 25,326,465 ops/sec ±1.81% (92 runs sampled)
/user/0123456789  x 12,204,680 ops/sec ±0.92% (89 runs sampled)
/user/0123456789012345678901234567890123456789  x 12,252,541 ops/sec ±1.55% (90 runs sampled)
/user/0123456789/posts  x 9,404,059 ops/sec ±1.88% (91 runs sampled)
/static/js/common.js  x 11,141,238 ops/sec ±3.72% (91 runs sampled)
/static/json/config.json  x 12,327,613 ops/sec ±1.80% (92 runs sampled)
/static/css/styles.css  x 15,215,719 ops/sec ±0.67% (90 runs sampled)
/static/  x 19,106,723 ops/sec ±0.34% (92 runs sampled)
/api/login  x 14,514,118 ops/sec ±1.36% (94 runs sampled)
/api/postings/details/misc/many/nodes/deep  x 4,266,487 ops/sec ±0.43% (92 runs sampled)
*
* */
