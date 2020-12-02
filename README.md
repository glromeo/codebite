# @codebite
## Make javascript development fun again!

In this monorepo there are a number of projects I worked on to create a web development environment that's easy to use and as much as possible free from configuration frustration and build tools fatigue.

## *ES NEXT SERVER*

With **esnext-server** (inspired by [es-dev-server](https://github.com/open-wc/open-wc/tree/master/packages/es-dev-server)) you can serve the content and the code in your project applying any required transformation on the fly. You can use [babel](https://babeljs.io/) and [sass](https://sass-lang.com/) out of the box, just configure them for the feature you need and the server will apply the transformation when serving the files to the browser. The server uses babel by deafault to recognise and translate node module imports into **web_module** imports. 

## *WORKBENCH*

Testing a web interface in node is just wrong. Even small unit tests can be affected by the quirks of [jsdom](https://github.com/jsdom/jsdom) but how to make so that testing in the browser is as fast and debuggable as running [jest](https://jestjs.io/) in your IDE? And how to have nice feature like snapshot testing and [code coverage](https://istanbul.js.org/)?
Workbench provides a test runner based on [Jasmine](https://jasmine.github.io/) that does all of that from within the broser.

## *LOGGER*

This module takes care of the logging when writing node.js code so that it's easy to spot the information you need and nice to look at.

## *WEB MODULES*

Despite some have a hybrid approach, most of node modules are meant to be consumed by node, not the browser. Tools like WebPack implicitly smooth out the difference by bundling but when you try to use real ES imports then the difference becomes a constant source of problems. To escape this hell one can use web modules which are a [rolled-up](https://rollupjs.org/guide/en/) version of the corresponding node modules bundled to be used in browsers that support import. In order to preserve the current way of coding there is a babel plugin rewrites bare imports like:
```javascript
import {html, render} from "lit-html";
import {unsafeHTML} from "lit-html/directives/unsafe-html.js";
```
into:
```javascript
import {html, render} from "/web_modules/lit-html/lit-html.js";
import {unsafeHTML} from "/web_modules/lit-html/directives/unsafe-html.js";
```
In this example you see the effect of using micro bundles. Lit HTML has a main entry point which imports most of the files in the package but not all of them (e.g. what's in directives folder). Unless one would look at the whole client codebase to see what's imported and what not it couldn't be possible to create a bundle out of the lit-html package alone. What the web modules logic does is creating bundle starting from the main (or module) entry in package.json then, later on, whenever a file that's not included in it is imported it resolves all the imports of that file eiter to the micro bundle or other independent files applying on them this rewrite process recursively.

> The idea of web modules has been initially borrowed from [pika](https://www.pika.dev/) but then turned into something quite different. While it's true that maintaining a 1-1 correspondence between the files in the web module and the node module would allow these files to be shared as intended by the package authors, in reality very small import files slow down significantly and application. Even when HTTP/2 push is used a bundle wins hands down and that's why micro bundles have been introduced. They are the best compromise between a full bundle and fine grained imports.

The initial load of a web module is typically slow but once the bundle is written to disk there's no need to rebuild it until the package version changes and this saves a lot of time in subsequent server restarts.