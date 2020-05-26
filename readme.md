# Swup Morph plugin

This [swup](https://github.com/swup/swup) plugin allows morphing containers into the new page without replacing or animating them. The prime use case are headers and menus on multi-language sites: you might not want to swap these elements out with a transition on each page visit, however you'd still want to update any URLs, labels or classnames when the user switches between languages.

Behind the scenes, it uses [morphdom](https://github.com/patrick-steele-idem/morphdom) to update the existing DOM nodes to match the same DOM nodes on the new page being loaded. This will leave any event handlers in place, as opposed to setting `innerHTML` on the target.

## Installation

This plugin can be installed with npm

```bash
npm install swup-morph-plugin
```

and included with import

```shell
import SwupMorphPlugin from 'swup-morph-plugin';
```

or included from the dist folder

```html
<script src="./dist/SwupMorphPlugin.js"></script>
```

## Usage

To run this plugin, include an instance in the swup options.

```javascript
const swup = new Swup({
  plugins: [new SwupMorphPlugin()]
});
```

## Options

### containers

Array of DOM selectors that will be morphed into the new page. Required.

```javascript
{
  containers: ['#nav']
}
```
