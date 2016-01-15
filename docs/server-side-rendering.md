Server-side Rendering
=====================

Server-side rendering is great for SEO, as well as progressive enhancement. When rendering on the server, we have a special set of constraints that we need to follow when building components and libraries.

tl;dr: Don't depend on the DOM/BOM; make sure your initial render is synchronous; don't mutate class variables; add the `/** @ssr-ready **/` pragma.

#### React Components

React components used on the server will be rendered to HTML by being passed to a [renderToString()](https://facebook.github.io/react/docs/top-level-api.html#reactdomserver.rendertostring) call, which calls `componentWillMount()` and `render()` _once_. This means that any components in the `shared` folder need to satisfy the following constraints:
* Must not rely on event handling for the initial render.
* Must not hook up any change listeners, or do anything asynchronous, inside `componentWillMount()`.
* All data must be available before the initial render.
* Mutating class-level variables should be avoided, as they will be persisted until a server restart.
* Must not change component ID during `componentWillMount`.
* Must not assume that the DOM/BOM exists in `render()` and `componentWillMount()`.

#### Libraries

* Libraries that are used on the server should be mindful of the DOM not being available on the server, and should either: be modified to work without the DOM; have non-DOM specific fallbacks; or fail in an obvious manner.
* Singletons should be avoided, as once instantiated they will persist for the entire duration of the `node` process.

### Run different code on the client

Occasionally, it may be necessary to conditionally do something client-specific inside an individual source file. This is quite useful for libraries that are heavily DOM dependent, and require a different implementation on the server. Don't do this for React components, as it will likely cause reconciliation errors — factor out your dependencies instead.

Here's how your module's `package.json` should look, if you really want to do this:
```
{
	"main": "index.node.js",
	"browser": "index.web.js"
}
```

### Marking your code as compatible with server-side rendering

When you're satisfied that your component or library will render on the server, mark it and its dependencies as SSR-ready by inserting `/** @ssr-ready **/` at the top of the file. This will signal to the `PragmaChecker` webpack plugin that your file's dependencies should be checked. It also communicates to other developers that your code is going to be rendered on the server, so should be modified with care.

### I want to server-side render my components!

Awesome! We currently don't have a framework for this, so you'll likely have to add `renderToString` to the server route directly. In addition, there are a couple of things you'll need to keep in mind: if your components need dynamic data, we'll need to cache; `renderToString` is synchronous, and will affect server response time; you should add a test to `server/pages/test/index.js` to make sure your code doesn't break; our current routing is incompatible with SSR; if you want to SSR something logged in, dependency nightmares will ensue.

Please ping @ehg, @mcsf, @ockham, or @seear if you're thinking of doing this, or if you have any questions. :)