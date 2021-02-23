---
layout: page.11ty.cjs
title: <read-systerm-data> ⌲ Home
---

# &lt;read-systerm-data>

`<read-systerm-data>` is an awesome element. It's a great introduction to building web components with LitElement, with nice documentation site as well.

## As easy as HTML

<section class="columns">
  <div>

`<read-systerm-data>` is just an HTML element. You can it anywhere you can use HTML!

```html
<read-systerm-data></read-systerm-data>
```

  </div>
  <div>

<read-systerm-data></read-systerm-data>

  </div>
</section>

## Configure with attributes

<section class="columns">
  <div>

`<read-systerm-data>` can be configured with attributed in plain HTML.

```html
<read-systerm-data name="HTML"></read-systerm-data>
```

  </div>
  <div>

<read-systerm-data name="HTML"></read-systerm-data>

  </div>
</section>

## Declarative rendering

<section class="columns">
  <div>

`<read-systerm-data>` can be used with declarative rendering libraries like Angular, React, Vue, and lit-html

```js
import {html, render} from 'lit-html';

const name="lit-html";

render(html`
  <h2>This is a &lt;read-systerm-data&gt;</h2>
  <read-systerm-data .name=${name}></read-systerm-data>
`, document.body);
```

  </div>
  <div>

<h2>This is a &lt;read-systerm-data&gt;</h2>
<read-systerm-data name="lit-html"></read-systerm-data>

  </div>
</section>
